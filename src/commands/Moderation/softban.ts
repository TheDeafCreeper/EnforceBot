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
    name: 'softban',
    description: 'Softban a user.',
    options: [{
        name: 'target',
        description: 'The user to softban.',
        type: 'USER',
        required: true,
    },
    {
        name: 'reason',
        description: 'The reason for the softban.',
        type: 'STRING',
        required: true,
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

        if (!actor.canRunCommand('softban')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let target = await (new Member(server, args.getUser('target', true).id)).init();
        let channel = await (new Channel(server, interaction.channel as GuildTextBasedChannel)).init();

        const reason = args.getString('reason', true)
        let message = `<@!${target._id}> has been softban for ${reason}.`
        let DM = `You have been softban for ${reason}.`

        let deleteMessagesData: DeleteActionOptions = null;
        if (args.getBoolean('deletemessages', false)) deleteMessagesData = {timeframe: 30000, count: null};

        let punishment = new Punishment(actor, target, server, {
            sendMessage: message,
            sendDM: DM,
            warn: null,
            deleteMessages: deleteMessagesData,
            mute: null,
            quarantine: null,
            ban: null,
            kick: true,
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
        })
    }
})

function toSec(ms: number): number {
    return Math.floor(ms / 1000);
}