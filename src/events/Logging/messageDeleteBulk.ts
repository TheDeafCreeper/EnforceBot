import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { Channel } from '../../structures/Channel';
import { Collection, GuildTextBasedChannel, Message, MessageAttachment } from 'discord.js';
import * as fs from 'fs';

function toSec(num) {
    return Math.floor(num / 1000)
}

export default new Event('messageDeleteBulk', async (messages: Collection<string, Message>) => {
    let server = await (new Server(messages.first().guild)).init();
    let channel = await (new Channel(server, messages.first().channel as GuildTextBasedChannel)).init();
    let embed = new Embed()
    embed.setTitle(`${messages.size} Message Deleted`)
    embed.setColor(0xbd2615)

    embed.addField("Channel", `<#${messages.first().channel.id}>`)
    embed.addField("Messages Deleted", `<t:${toSec(Date.now())}:f>`)

    let msgs = []
    messages.forEach(message => {
        msgs.push(`${message.member.displayName}: ${message.content}`)
    });

    if (msgs.join('\n').length > 2048) {
        fs.writeFileSync(`./BulkDeleteTextDocs/${messages.first().channel.id}.txt`, msgs.reverse().join('\n'))
        server.sendLog('messageDeleteBulk', { attachments: [
            new MessageAttachment(`./BulkDeleteTextDocs/${messages.first().channel.id}.txt`)
        ], embeds: [embed.embed]}, channel, null)
        fs.unlinkSync(`./BulkDeleteTextDocs/${messages.first().channel.id}.txt`)
    } else {
        embed.addField("Content", msgs.join('\n'))
        server.sendLog('messageDeleteBulk', {embeds: [embed.embed]}, channel, null)
    }
});