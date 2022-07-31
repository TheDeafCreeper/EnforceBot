import { ThreadChannel } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('threadDelete', async (thread: ThreadChannel) => {
    let server = await (new Server(thread.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Thread Deleted`)
    embed.setColor(0xff0000)

    embed.addField(`Channel:`, `<#${thread.parent.id}>`)
    embed.addField(`Thread Name:`, thread.name)
    embed.addField(`Thread Owner:`, `<@${thread.ownerId}>`)
    embed.addField(`Private Thread:`, thread.type === 'GUILD_PRIVATE_THREAD' ? "Yes" : "No")
    embed.setFooter(thread.id)

    server.sendLog('threadDelete', {embeds: [embed.embed]}, null, null)
});