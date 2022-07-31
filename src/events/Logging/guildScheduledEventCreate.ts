import { GuildScheduledEvent } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildScheduledEventCreate', async (event: GuildScheduledEvent) => {
    let server = await (new Server(event.guild)).init();
    let member = await (new Member(server, event.creator.id)).init();

    let embed = new Embed()
    embed.setTitle(`Event Created`)
    embed.setAuthor(member)
    embed.setColor(0x00ff00)

    embed.addField(`Event Name:`, event.name)
    embed.addField(`Description:`, event.description ?? 'None')
    embed.addField("Created At:", `<t:${toSec(event.createdTimestamp)}:f>`)
    if (event.scheduledEndTimestamp) embed.addField("Schedualed Run Time:", `<t:${toSec(event.scheduledStartTimestamp)}:f> - <t:${toSec(event.scheduledEndTimestamp)}:f>`)
    else embed.addField("Schedualed Start Time:", `<t:${toSec(event.scheduledStartTimestamp)}:f>`)
    if (event.channelId) embed.addField("Channel", `<#${event.channelId}>`)
    else embed.addField("Location:", "Unknown")
    embed.addField("Privacy Level:", event.privacyLevel != "GUILD_ONLY" ? "Public" : "Guild Only")

    embed.setFooter(event.id)

    server.sendLog('guildScheduledEventCreate', { embeds: [embed.embed] }, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}