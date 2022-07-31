import { ThreadChannel } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('threadUpdate', async (oldThread: ThreadChannel, newThread: ThreadChannel) => {
    let server = await (new Server(oldThread.guild)).init();

    let embed = new Embed()

    if (oldThread.archived === newThread.archived) {
        embed.setTitle(`Thread Updated`)
        embed.setColor(0xffff00)

        if (oldThread.name !== newThread.name) embed.addField(`Thread Name:`, `${oldThread.name} >> ${newThread.name}`)
        else embed.addField(`Thread Name:`, `${oldThread.name}`)
        embed.addField(`Channel:`, `<#${oldThread.parent.id}>`)

        if (oldThread.ownerId !== newThread.ownerId) embed.addField(`Thread Owner:`, `<@${oldThread.ownerId} >> <@${newThread.ownerId}>`)
        embed.setFooter(oldThread.id)
    } else if (oldThread.archived) {
        embed.setTitle(`Thread Unarchived`)
        embed.setColor(0xffff00)
        embed.addField(`Thread Name:`, `${oldThread.name}`)
        embed.addField(`Channel:`, `<#${oldThread.parent.id}>`)
    } else {
        embed.setTitle(`Thread Archived`)
        embed.setColor(0xffff00)
        embed.addField(`Thread Name:`, `${oldThread.name}`)
        embed.addField(`Channel:`, `<#${oldThread.parent.id}>`)
    }

    server.sendLog('threadUpdate', {embeds: [embed.embed]}, null, null)
});