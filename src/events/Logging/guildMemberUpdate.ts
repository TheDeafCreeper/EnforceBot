import { GuildMember } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildMemberUpdate', async (oldGuildMember: GuildMember, newGuildMember: GuildMember) => {
    let server = await (new Server(oldGuildMember.guild)).init();
    let member = await (new Member(server, newGuildMember.id)).init();

    let embed = new Embed()
    embed.setTitle(`Member Updated`)
    embed.setAuthor(member)
    embed.setColor(0xffff00)

    if (oldGuildMember.avatarURL() != newGuildMember.avatarURL())
        embed.addField(`Avatar:`, `${oldGuildMember.avatarURL()} >> ${newGuildMember.avatarURL()}`)
    if (oldGuildMember.nickname != newGuildMember.nickname)
        embed.addField(`Nickname:`, `${oldGuildMember.nickname} >> ${newGuildMember.nickname}`)
    if (oldGuildMember.roles.cache.size != newGuildMember.roles.cache.size)
        embed.addField(`Roles:`,
        `${oldGuildMember.roles.cache.map(role => `<@&${role.id}>`).join(", ")} >> ${newGuildMember.roles.cache.map(role => `<@&${role.id}>`).join(", ")}`)
    if (oldGuildMember.communicationDisabledUntilTimestamp != newGuildMember.communicationDisabledUntilTimestamp)
        embed.addField(`Timeout:`, `<t:${oldGuildMember.communicationDisabledUntilTimestamp}:F> >> <t:${newGuildMember.communicationDisabledUntilTimestamp}:F>`)

    if (embed.embed.fields.length > 0) server.sendLog('guildMemberUpdate', {embeds: [embed.embed]}, null, null)
});