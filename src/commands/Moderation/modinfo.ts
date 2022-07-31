import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { InteractionCache, timeToText, toSec } from '../../run'
import { MessageComponents } from '../../structures/MessageComponents';

const timeFromText = require('timestring');

export default new Command({
    name: 'modinfo',
    description: 'See some mod information on a user.',
    options: [{
        name: 'user',
        description: 'The user to get modinfo for.',
        type: 'USER',
        required: true,
    }],
    hidden: false,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('modinfo')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let user = await (new Member(server, args.getUser('user', true).id)).init();

        const historyCacheData = {
            id: InteractionCache.uuid(),
            type: 'history',
            page: 0,
            filters: ['warn', 'mute', 'quarantine', 'kick', 'softban', 'ban'],
            activeOnly: false,
            member: user
        }
        InteractionCache.save(historyCacheData.id, historyCacheData);

        const notesCacheData = {
            id: InteractionCache.uuid(),
            type: 'notes',
            page: 0,
            member: user
        }
        InteractionCache.save(notesCacheData.id, notesCacheData);

        let embed = new Embed();

        embed.setTitle(`Mod Info on ${user.displayName}`);
        embed.setColor(0xffff00);
        embed.setThumbnail(user.avatarURL);

        let userInfo = `User ID: ${user._id}\n`;
        userInfo += `Username: ${user.username}#${user.discriminator}\n`;
        userInfo += `First Joined: <t:${toSec(user.firstJoin)}:f>\n`;
        userInfo += `Most Recently Joined: <t:${toSec(user.member.joinedTimestamp)}:f>\n`;
        userInfo += `Account Created: <t:${toSec(user.user.createdTimestamp)}:f>`;
        embed.addField('User Info', userInfo);

        let modInfo = `Known Raider: ${user.isRaider ? 'Yes' : 'No'}\n`;
        modInfo += `Account Compromised: ${user.isCompromised ? 'Yes' : 'No'}\n`;
        modInfo += `History Length: ${user.moderation.history.length}\n`;
        modInfo += `Note Count: ${user.moderation.notes.length}\n`;
        modInfo += `Message Count: ${user.messageCount}`;
        if (user.joinGroup !== null && user.joinGroup !== undefined) modInfo += `\nJoin Group: ${user.joinGroup}`;
        embed.addField('Mod Info', modInfo);

        const trustValue = user.getTrust();
        let trustString = `${trustValue}`

        if (trustValue > 70) trustString += ` | **Perfect**`;
        else if (trustValue > 60) trustString += ` | Excellent`
        else if (trustValue > 40) trustString += ` | Great`
        else if (trustValue > 20) trustString += ` | Good`
        else if (trustValue > 0) trustString += ` | Okay`
        else if (trustValue > -10) trustString += ` | Poor`
        else if (trustValue > -20) trustString += ` | Bad`
        else if (trustValue > -30) trustString += ` | Very Bad`
        else if (trustValue > -40) trustString += ` | Terrible`
        else trustString += ` | **Atrocious**`
        
        embed.addField(`Trust Rating`, trustString);

        const history = user.moderation.history;
        if (history.length > 0) {
            let entry = history[history.length - 1];
            let text = `Type: ${entry.type}\n`;
            text += `Actor: <@${entry.actor}>\n`;
            text += `Reason: ${entry.reason}\n`;
            text += `Duration: ${entry.duration ? timeToText(entry.duration) : 'Permanent'}\n`;
            if (entry.expires > Date.now() || entry.expires == -1) text += `Expires: ${entry.expires != -1 ? `<t:${toSec(entry.expires)}:R>` : 'Never'}\n`;
            else text += `Expired: <t:${toSec(entry.expires)}:R>\n`;
            embed.addField(`Latest Punishment`, text);
        } else embed.addField(`Latest Punishment`, 'None');
        
        const notes = user.moderation.notes;
        if (notes.length > 0) {
            let note = notes[notes.length - 1];
            embed.addField(`Latest Note:`, `${note.author}:\n${note.note}`);
        } else embed.addField(`Latest Note`, 'None');

        let components = new MessageComponents();

        components.addRow();
        components.addButton(0, {
            label: 'View Full History',
            style: 'SECONDARY',
            customId: `${historyCacheData.id}|First`
        })
        components.addButton(0, {
            label: 'View All Notes',
            style: 'SECONDARY',
            customId: `${notesCacheData.id}|First`
        })

        interaction.editReply({
            embeds: [embed.embed],
            components: components.actionRows
        }).catch(err => {});
    }
})