import { GuildEmoji, Role } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('emojiUpdate', async (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => {
    let server = await (new Server(oldEmoji.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Emoji Updated`)
    embed.setColor(0xffff00)

    if (oldEmoji.name != newEmoji.name) embed.addField(`Emoji Name:`, `${oldEmoji.name} >> ${newEmoji.name}`)
    if (oldEmoji.roles.cache.difference(newEmoji.roles.cache).size > 0) {
        let oldRoles: Array<string>
        let newRoles: Array<string>
        oldEmoji.roles.cache.forEach((role: Role) => oldRoles.push(`<@&${role.id}>`))
        newEmoji.roles.cache.forEach((role: Role) => newRoles.push(`<@&${role.id}>`))

        embed.addField("Old Roles:", oldRoles.join(", "))
        embed.addField("New Roles:", newRoles.join(", "))
    }

    embed.setFooter(newEmoji.id)

    server.sendLog('emojiUpdate', {embeds: [embed.embed]}, null, null)
});