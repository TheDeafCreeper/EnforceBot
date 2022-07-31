import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Punishment } from '../../structures/Punishment';
import { DeleteActionOptions } from '../../typings/Punishment'
import { Channel } from '../../structures/Channel';
import { GuildTextBasedChannel } from 'discord.js';
import { InteractionCache } from '../../run'
import { MessageComponents } from '../../structures/MessageComponents';

const timeFromText = require('timestring');

export default new Command({
    name: 'warn',
    description: 'Warn a user.',
    options: [{
        name: 'target',
        description: 'The user to warn.',
        type: 'USER',
        required: true,
    },
    {
        name: 'reason',
        description: 'The reason for the warning.',
        type: 'STRING',
        required: true,
    },
    {
        name: 'duration',
        description: 'The duration of the warning.',
        type: 'STRING',
        required: false,
    },
    {
        name: 'deletemessages',
        description: 'Whether or not to delete recent messages.',
        type: 'BOOLEAN',
        required: false,
    }
    ],
    hidden: true,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('warn')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let target = await (new Member(server, args.getUser('target', true).id)).init();
        let channel = await (new Channel(server, interaction.channel as GuildTextBasedChannel)).init();

        const reason = args.getString('reason', true)
        const durationString = args.getString('duration', false)
        let message = `<@!${target._id}> has been warned for ${reason}.`
        let DM = `You have been warned for ${reason}.`

        let duration = durationString != null?timeFromText(durationString):-1;
        if (duration != -1) duration *= 1000;
        if (duration > 315576000000) duration = -1;

        let part2 = ''
        if (duration != -1) part2 += ` The warning will expire <t:${toSec(Date.now() + duration)}:f>`
        else part2 += ` The warning will never expire.`

        message = message + part2
        DM = DM + part2

        let deleteMessagesData: DeleteActionOptions = null;
        if (args.getBoolean('deletemessages', false)) deleteMessagesData = {timeframe: 30000, count: null};

        let punishment = new Punishment(actor, target, server, {
            sendMessage: message,
            sendDM: DM,
            warn: duration,
            deleteMessages: deleteMessagesData,
            mute: null,
            quarantine: null,
            ban: null,
            kick: null,
            softBan: null
        }, reason)

        const interactionCacheData = {
            id: InteractionCache.uuid(),
            type: 'punishment',
            channel: channel,
            punishment: punishment
        }
        
        InteractionCache.save(interactionCacheData.id, interactionCacheData);

        const components = new MessageComponents();
        components.addRow();
        components.addButton(0, {
            label: 'Yes',
            style: 'SUCCESS',
            customId: `${interactionCacheData.id}|Yes`,
        })
        components.addButton(0, {
            label: 'No',
            style: 'DANGER',
            customId: `${interactionCacheData.id}|No`,
        })

        interaction.editReply({
            content: `Does this look right?`,
            embeds: [punishment.getEmbed().embed],
            components: components.actionRows
        }).catch(err => {})
    }
})

function toSec(ms: number): number {
    return Math.floor(ms / 1000);
}