import { Invite, Guild } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('inviteCreate', async (invite: Invite) => {
    let server = await (new Server(invite.guild as Guild)).init();
    let member = await (new Member(server, invite.inviter.id)).init();

    let embed = new Embed()
    embed.setTitle(`Invite Created`)
    embed.setColor(0x00ff00)
    embed.setAuthor(member)

    embed.addField(`Invite Code:`, invite.code)
    embed.addField(`Channel:`, `<#${invite.channel.id}>`)
    embed.addField(`Created At:`, `<t:${toSec(invite.createdTimestamp)}:f>`)

    server.sendLog('inviteCreate', {embeds: [embed.embed]}, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}