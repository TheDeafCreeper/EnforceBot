import { GuildScheduledEvent } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildScheduledEventUpdate', async (oldEvent: GuildScheduledEvent, newEvent: GuildScheduledEvent) => {
    let server = await (new Server(oldEvent.guild)).init();
    let member = await (new Member(server, oldEvent.creator.id)).init();

    if (oldEvent.status == "SCHEDULED" && newEvent.status == "ACTIVE") {
        let embed = new Embed()
        embed.setTitle(`Event Started`)
        embed.setColor(0x00ff00)

        embed.addField(`Event Name:`, newEvent.name)
        embed.addField(`Description:`, newEvent.description ?? 'None')
        embed.addField("Created At:", `<t:${toSec(newEvent.createdTimestamp)}:f>`)
        embed.addField("Started At:", `<t:${toSec(newEvent.scheduledStartTimestamp)}:f>`)
        if (newEvent.scheduledEndTimestamp) embed.addField("Schedualed Run Time:", `<t:${toSec(newEvent.scheduledStartTimestamp)}:f> - <t:${toSec(newEvent.scheduledEndTimestamp)}:f>`)
        else embed.addField("Schedualed Start Time:", `<t:${toSec(newEvent.scheduledStartTimestamp)}:f>`)
        if (newEvent.channelId) embed.addField("Channel", `<#${newEvent.channelId}>`)
        else embed.addField("Location:", "Unknown")
        embed.addField("Privacy Level:", newEvent.privacyLevel != "GUILD_ONLY" ? "Public" : "Guild Only")

        embed.setFooter(newEvent.id)
        server.sendLog('guildScheduledEventUpdate', { embeds: [embed.embed] }, null, null)
    } else if (newEvent.status == "COMPLETED") {
        let embed = new Embed()
        embed.setTitle(`Event Completed`)
        embed.setColor(0x00ff00)

        embed.addField(`Event Name:`, newEvent.name)
        embed.addField(`Description:`, newEvent.description ?? 'None')
        embed.addField("Created At:", `<t:${toSec(newEvent.createdTimestamp)}:f>`)
        embed.addField("Completed At:", `<t:${toSec(Date.now())}:f>`)
        if (newEvent.scheduledEndTimestamp) embed.addField("Schedualed Run Time:", `<t:${toSec(newEvent.scheduledStartTimestamp)}:f> - <t:${toSec(newEvent.scheduledEndTimestamp)}:f>`)
        else embed.addField("Schedualed Start Time:", `<t:${toSec(newEvent.scheduledStartTimestamp)}:f>`)
        if (newEvent.channelId) embed.addField("Channel", `<#${newEvent.channelId}>`)
        else embed.addField("Location:", "Unknown")
        embed.addField("Privacy Level:", newEvent.privacyLevel != "GUILD_ONLY" ? "Public" : "Guild Only")

        embed.setFooter(newEvent.id)
        server.sendLog('guildScheduledEventUpdate', { embeds: [embed.embed] }, null, null)
    } else {
        let embed = new Embed()
        embed.setTitle(`Event Updated`)
        embed.setColor(0xffff00)

        if (oldEvent.name != newEvent.name)
            embed.addField(`Event Name:`, `${oldEvent.name} >> ${newEvent.name}`)

        if (oldEvent.description != newEvent.description)
            embed.addField(`Description:`, `${oldEvent.description}\n**VVVVV**\n${newEvent.description}`)

        if (oldEvent.scheduledStartTimestamp != newEvent.scheduledStartTimestamp)
            embed.addField("Schedualed Start Time:", `<t:${toSec(oldEvent.scheduledStartTimestamp)}:f> >> <t:${toSec(newEvent.scheduledStartTimestamp)}:f>`)

        if (oldEvent.scheduledStartTimestamp != newEvent.scheduledStartTimestamp)
            embed.addField("Schedualed Start Time:", `<t:${toSec(oldEvent.scheduledStartTimestamp)}:f> >> <t:${toSec(newEvent.scheduledStartTimestamp)}:f>`)

        if (oldEvent.scheduledEndTimestamp != newEvent.scheduledEndTimestamp)
            embed.addField("Schedualed End Time:", `<t:${toSec(oldEvent.scheduledEndTimestamp)}:f> >> <t:${toSec(newEvent.scheduledEndTimestamp)}:f>`)

        if (oldEvent.channelId != newEvent.channelId)
            embed.addField("Channel", `<#${oldEvent.channelId}> >> <#${newEvent.channelId}>`)

        if (oldEvent.privacyLevel != newEvent.privacyLevel)
            embed.addField("Privacy Level:", `${oldEvent.privacyLevel} >> ${newEvent.privacyLevel}`)

        if (oldEvent.status != newEvent.status)
            embed.addField("Status:", `${oldEvent.status} >> ${newEvent.status}`)

        embed.setFooter(newEvent.id)
        server.sendLog('guildScheduledEventUpdate', { embeds: [embed.embed] }, null, null)
    }
});

function toSec(num) {
    return Math.floor(num / 1000)
}