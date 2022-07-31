import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { InteractionCache, timeToText, toSec } from '../../run'
import { MessageComponents } from '../../structures/MessageComponents';

const timeFromText = require('timestring');

export default new Command({
    name: 'history',
    description: 'See a user\'s history.',
    options: [{
        name: 'user',
        description: 'The user to get history for.',
        type: 'USER',
        required: true,
    }],
    hidden: false,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('history')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let user = await (new Member(server, args.getUser('user', true).id)).init();

        const interactionCacheData = {
            id: InteractionCache.uuid(),
            type: 'history',
            page: 0,
            filters: ['warn', 'mute', 'quarantine', 'kick', 'softban', 'ban'],
            activeOnly: false,
            member: user
        }
        InteractionCache.save(interactionCacheData.id, interactionCacheData);

        const { filters, page, activeOnly } = interactionCacheData;
        let embed = new Embed();

        embed.setTitle(`${user.displayName}'s History`);
        embed.setColor(0xff0000)
        let text = ``;
        text += `Total Punishments: ${user.moderation.history.length}\n`;
        text += `Filters:\n`;
        text += `${filters.includes('warn') ? '🟩' : '🟥'} Warnings\n`;
        text += `${filters.includes('mute') ? '🟩' : '🟥'} Mutes\n`;
        text += `${filters.includes('quarantine') ? '🟩' : '🟥'} Quarantines\n`;
        text += `${filters.includes('kick') ? '🟩' : '🟥'} Kicks\n`;
        text += `${filters.includes('softban') ? '🟩' : '🟥'} Softbans\n`;
        text += `${filters.includes('ban') ? '🟩' : '🟥'} Bans\n`;
        text += `${!activeOnly ? '🟩' : '🟥'} Inactive Punishments`;

        embed.setDescription(text);

        const history = user.moderation.history;
        const entriesPerPage = 6;
        for (let i = page * entriesPerPage; i < history.length && i < (page * entriesPerPage) + entriesPerPage; i++) {
            if (i % 2 == 0) embed.addBlankField();
            let entry = history[i];

            let text = ``;
            text += `Actor: <@${entry.actor}>\n`;
            text += `Reason: ${entry.reason}\n`;
            text += `Duration: ${entry.duration ? timeToText(entry.duration) : 'Permanent'}\n`;
            if (entry.expires > Date.now() || entry.expires == -1) text += `Expires: ${entry.expires != -1 ? `<t:${toSec(entry.expires)}:R>` : 'Never'}\n`;
            else text += `Expired: <t:${toSec(entry.expires)}:R>\n`;
            embed.addField(`${entry.type}`, text, true);
        }

        if (history.length == 0) embed.addField('There\'s nothing here!', 'This user has no history.');

        embed.setFooter(`Page ${page + 1}/${Math.ceil(history.length / entriesPerPage)}`);

        let components = new MessageComponents();

        components.addRow();
        components.addButton(0, {
            label: '<< First',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|First`,
            disabled: true
        })
        components.addButton(0, {
            label: '< Back',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|Back`,
            disabled: true
        })
        components.addButton(0, {
            label: 'Next >',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|Next`,
            disabled: history.length < entriesPerPage
        })
        components.addButton(0, {
            label: 'Last >>',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|Last`,
            disabled: history.length < entriesPerPage
        })

        components.addRow();
        components.addSelectMenu(1, {
            placeholder: 'Select Filters',
            customId: `${interactionCacheData.id}|Filters`,
            minValues: 1,
            maxValues: 6,
            options: [
                {
                    label: 'Warnings',
                    value: 'warn',
                    //default: filters.includes('warn')
                },
                {
                    label: 'Mutes',
                    value: 'mute',
                    //default: filters.includes('mute')
                },
                {
                    label: 'Quarantines',
                    value: 'quarantine',
                    //default: filters.includes('quarantine')
                },
                {
                    label: 'Kicks',
                    value: 'kick',
                    //default: filters.includes('kick')
                },
                {
                    label: 'Softbans',
                    value: 'softban',
                    //default: filters.includes('softban')
                },
                {
                    label: 'Bans',
                    value: 'ban',
                    //default: filters.includes('ban')
                }
            ]
        })

        components.addRow();
        components.addButton(2, {
            label: 'Show Inactive',
            style: 'SUCCESS',
            customId: `${interactionCacheData.id}|ShowInactive`,
            disabled: true
        })
        components.addButton(2, {
            label: 'Hide Inactive',
            style: 'DANGER',
            customId: `${interactionCacheData.id}|HideInactive`,
            disabled: false
        });

        interaction.editReply({
            embeds: [embed.embed],
            components: components.actionRows
        }).catch(err => {});
    }
})