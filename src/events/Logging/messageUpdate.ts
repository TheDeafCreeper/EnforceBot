import { Message, GuildTextBasedChannel } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { Channel } from '../../structures/Channel';

function toSec(num) {
    return Math.floor(num / 1000)
}

export default new Event('messageUpdate', async (oldMessage: Message, newMessage: Message) => {
    if (newMessage.content == oldMessage.content) return;
    if (newMessage.interaction?.id) return;

    let server = await (new Server(newMessage.guild)).init();
    let member = await (new Member(server, newMessage.member.id)).init();
    let channel = await (new Channel(server, newMessage.channel as GuildTextBasedChannel)).init();

    let embed = new Embed()
    embed.setTitle("Message Updated")
    embed.setAuthor(member)
    embed.setDescription(`[Jump to message](${newMessage.url})`)

    embed.addField("Channel", `<#${newMessage.channel.id}>`)
    embed.addField("Message Sent", `<t:${toSec(newMessage.createdTimestamp)}:f>`)
    embed.addField("Message Edited", `<t:${toSec(newMessage.editedTimestamp)}:f>`)

    if (oldMessage.content.length > 2048) embed.addField("Old Content", oldMessage.content.substring(0, 2045) + "...")
    else embed.addField("Old Content", oldMessage.content)

    if (newMessage.content.length > 2048) embed.addField("New Content", newMessage.content.substring(0, 2045) + "...")
    else embed.addField("New Content", newMessage.content)

    embed.setColor(0xdbd800)
    embed.setFooter(newMessage.id)
    server.sendLog('messageUpdate', {embeds: [embed.embed]}, channel, member.member)
});