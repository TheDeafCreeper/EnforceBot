import { Invite, Guild } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('inviteDelete', async (invite: Invite) => {
    let server = await (new Server(invite.guild as Guild)).init();

    let embed = new Embed()
    embed.setTitle(`Invite Deleted`)
    embed.setColor(0xff0000)

    embed.addField(`Invite Code:`, invite.code)
    embed.addField(`Channel:`, `<#${invite.channel.id}>`)
    embed.addField(`Created At:`, `<t:${toSec(invite.createdTimestamp)}:f>`)
    embed.addField(`Deleted At:`, `<t:${toSec(Date.now())}:f>`)

    server.sendLog('inviteDelete', {embeds: [embed.embed]}, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}