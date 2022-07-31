import { GuildBan } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildBanAdd', async (ban: GuildBan) => {
    let server = await (new Server(ban.guild)).init();
    let member = await (new Member(server, ban.user.id)).init();

    const auditEntries = await server.guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD', limit: 1})
    const auditEntry = auditEntries.entries.first()

    if (auditEntry.executor.id === server.guild.me.id) return;

    let embed = new Embed()
    embed.setTitle(`Member Banned`)
    embed.setAuthor(member)
    embed.setColor(0xff0000)
    embed.addField(`Reason:`, ban.reason || "No Reason Provided")
    embed.addField(`Banned By:`, `<@${auditEntry.executor.id}>`)
    embed.addField(`Banned At:`, `<t:${toSec(auditEntry.createdTimestamp)}:f>`)
    embed.setFooter(member._id)

    server.sendLog('guildBanAdd', { embeds: [embed.embed] }, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}