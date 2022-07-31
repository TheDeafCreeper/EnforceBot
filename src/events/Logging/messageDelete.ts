import { Message, GuildTextBasedChannel } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { Channel } from '../../structures/Channel';
import PKAPI from 'pkapi.js'
import { PKMessage } from '../../typings/PKAPI';

const pk = new PKAPI()

function toSec(num) {
    return Math.floor(num / 1000)
}

export default new Event('messageDelete', async (message: Message) => {
    if (message.interaction?.id) return;

    let server = await (new Server(message.guild)).init();

    if (server.isLoggingChannel(message.channel.id)) return;

    let member = await (new Member(server, message.member.id)).init();
    let channel = await (new Channel(server, message.channel as GuildTextBasedChannel)).init();

    let pkmsg = await pk.getMessage({ message: message.id }).catch(err => {return null}) as PKMessage;

    if (pkmsg !== null) {
        if (message.id != pkmsg.original) {
            let embed = new Embed()
            embed.setTitle("Message Deleted")
            embed.embed.setAuthor({name: pkmsg.member.display_name, iconURL: pkmsg.member.avatar_url})
            embed.setColor(0xbd2615)

            embed.addField("Channel", `<#${message.channel.id}>`)
            embed.addField("Message Sent", `<t:${toSec(message.createdTimestamp)}:f>`)
            embed.addField("Message Deleted", `<t:${toSec(Date.now())}:f>`)

            if (message.content.length > 2048) embed.addField("Content", message.content.substring(0, 2045) + "...")
            else if (message.content != "") embed.addField("Content", message.content)
            else embed.addField("Content", "[Embeds/Attachements only]")

            embed.setFooter(message.id)
            server.sendLog('messageDelete', { embeds: [embed.embed] }, channel, member.member)
        }
    } else {
        let embed = new Embed()
        embed.setTitle("Message Deleted")
        embed.setAuthor(member)
        embed.setColor(0xbd2615)

        embed.addField("Channel", `<#${message.channel.id}>`)
        embed.addField("Message Sent", `<t:${toSec(message.createdTimestamp)}:f>`)
        embed.addField("Message Deleted", `<t:${toSec(Date.now())}:f>`)

        if (message.content.length > 2048) embed.addField("Content", message.content.substring(0, 2045) + "...")
        else if (message.content != "") embed.addField("Content", message.content)
        else embed.addField("Content", "[Embeds/Attachements only]")

        embed.setFooter(message.id)
        server.sendLog('messageDelete', {embeds: [embed.embed]}, channel, member.member)
    }
});