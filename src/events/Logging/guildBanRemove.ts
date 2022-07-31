import { GuildBan } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildBanRemove', async (ban: GuildBan) => {
    let server = await (new Server(ban.guild)).init();
    let member = await (new Member(server, ban.user.id)).init();

    let embed = new Embed()
    embed.setTitle(`Member Unbanned`)
    embed.setAuthor(member)
    embed.setColor(0x00ff00)
    embed.addField(`Ban Reason:`, ban.reason || "No Reason Provided")
    embed.setFooter(member._id)

    server.sendLog('guildBanRemove', { embeds: [embed.embed] }, null, null)
});