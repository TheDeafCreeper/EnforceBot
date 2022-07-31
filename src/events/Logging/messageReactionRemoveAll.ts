import { Message, GuildTextBasedChannel, Collection, MessageReaction } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Channel } from '../../structures/Channel';

function toSec(num) {
    return Math.floor(num / 1000)
}

export default new Event('messageReactionRemoveAll', async (message: Message, reactions: Collection<string, MessageReaction>) => {
    let server = await (new Server(message.guild)).init();
    let channel = await (new Channel(server, message.channel as GuildTextBasedChannel)).init();

    let embed = new Embed()
    embed.setTitle(`All (${reactions.size}) Reactions Removed`)
    embed.setDescription(`[Jump to message](${message.url})`)
    embed.setColor(0xff0000)

    embed.addField("Channel", `<#${message.channel.id}>`)
    embed.addField("Message Sent", `<t:${toSec(message.createdTimestamp)}:f>`)
    embed.addField("Reactions Removed", `<t:${toSec(Date.now())}:f>`)

    server.sendLog('messageReactionRemoveAll', {embeds: [embed.embed]}, channel, null)
});