import { NonThreadGuildBasedChannel, TextChannel, VoiceChannel, } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('channelUpdate', async (oldChannel: NonThreadGuildBasedChannel, newChannel: NonThreadGuildBasedChannel) => {
    let server = await (new Server(oldChannel.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Channel Updated`)
    embed.setColor(0xffff00)

    let nameChanged = false

    if (oldChannel?.parent?.name != newChannel?.parent?.name) embed.addField(`Category:`, `${oldChannel?.parent?.name} >> ${newChannel?.parent?.name}`)
    if (oldChannel.name != newChannel.name) { embed.addField(`Channel Name:`, `${oldChannel.name} >> ${newChannel.name}`); nameChanged = true }
    else embed.addField(`Channel Name:`, `${oldChannel.name}`)
    if (oldChannel.type != newChannel.type) embed.addField(`Channel Type:`, `${oldChannel.type} >> ${newChannel.type}`)
    if (oldChannel.position != newChannel.position) embed.addField(`Channel Position:`, `${oldChannel.position} >> ${newChannel.position}`)
    if (oldChannel.permissionsLocked != newChannel.permissionsLocked) embed.addField(`Permissions Synced:`, `${oldChannel.permissionsLocked} >> ${newChannel.permissionsLocked}`)

    //Text Channel Specific
    if (oldChannel.type == 'GUILD_TEXT' || oldChannel.type == 'GUILD_NEWS') {
        oldChannel = oldChannel as TextChannel
        newChannel = newChannel as TextChannel

        if (oldChannel.topic != newChannel.topic) embed.addField(`Topic:`, `${oldChannel.topic} >> ${newChannel.topic}`)
        if (oldChannel.rateLimitPerUser != newChannel.rateLimitPerUser) embed.addField(`Rate Limit:`, `${oldChannel.rateLimitPerUser} >> ${newChannel.rateLimitPerUser}`)
        if (oldChannel.nsfw != newChannel.nsfw) embed.addField(`NSFW:`, `${oldChannel.nsfw} >> ${newChannel.nsfw}`)
        if (oldChannel.defaultAutoArchiveDuration != newChannel.defaultAutoArchiveDuration) embed.addField(`Auto Archive:`, `${oldChannel.defaultAutoArchiveDuration} >> ${newChannel.defaultAutoArchiveDuration}`)
    }

    //Voice Channel Specific
    if (oldChannel.type == 'GUILD_VOICE' || oldChannel.type == 'GUILD_STAGE_VOICE') {
        oldChannel = oldChannel as VoiceChannel
        newChannel = newChannel as VoiceChannel
        if (oldChannel.bitrate != newChannel.bitrate) embed.addField(`Bitrate:`, `${oldChannel.bitrate} >> ${newChannel.bitrate}`)
        if (oldChannel.userLimit != newChannel.userLimit) embed.addField(`User Limit:`, `${oldChannel.userLimit} >> ${newChannel.userLimit}`)
        if (oldChannel.rtcRegion != newChannel.rtcRegion) embed.addField(`RTC Region:`, `${oldChannel.rtcRegion} >> ${newChannel.rtcRegion}`)
    }
    
    let oldPerms = oldChannel.permissionOverwrites.cache
    let newPerms = newChannel.permissionOverwrites.cache

    let permGroups = {}

    oldPerms.forEach(permissions => {
        permGroups[permissions.id] = { type: permissions.type }
        permissions.allow.toArray().forEach(perm => permGroups[permissions.id][perm] = { oldValue: true, newValue: null })
        permissions.deny.toArray().forEach(perm => permGroups[permissions.id][perm] = { oldValue: false, newValue: null })
    })

    newPerms.forEach(permissions => {
        if (permGroups[permissions.id] == undefined) permGroups[permissions.id] = { type: permissions.type }
        permissions.allow.toArray().forEach(perm => {
            if (permGroups[permissions.id][perm] == undefined) permGroups[permissions.id][perm] = { oldValue: null, newValue: true }
            else permGroups[permissions.id][perm].newValue = true
        })
        permissions.deny.toArray().forEach(perm => {
            if (permGroups[permissions.id][perm] == undefined) permGroups[permissions.id][perm] = { oldValue: null, newValue: false }
            else permGroups[permissions.id][perm].newValue = false
        })
    });

    for (let i in permGroups) {
        let permissions = permGroups[i]

        if (embed.embed.fields.length >= 24) break;
        let textLines = []
        let title = "Permission Overwrites for "
        if (permissions.type == "role") {
            let role = newChannel.guild.roles.resolve(i)
            title += `@${role.name}`
        } else {
            let member = newChannel.guild.members.resolve(i)
            title += `@${member.user.username}`
        }

        for (let l in permissions) {
            let perm = permissions[l]

            if (perm.oldValue == null && perm.newValue == true) textLines.push(`⬜ >> 🟩 | ${makeOnlyFirstCapital(l.split("_").join(" "))}`)
            if (perm.oldValue == null && perm.newValue == false) textLines.push(`⬜ >> 🟥 | ${makeOnlyFirstCapital(l.split("_").join(" "))}`)

            if (perm.oldValue == true && perm.newValue == false) textLines.push(`🟩 >> 🟥 | ${makeOnlyFirstCapital(l.split("_").join(" "))}`)
            if (perm.oldValue == true && perm.newValue == null) textLines.push(`🟩 >> ⬜ | ${makeOnlyFirstCapital(l.split("_").join(" "))}`)

            if (perm.oldValue == false && perm.newValue == true) textLines.push(`🟥 >> 🟩 | ${makeOnlyFirstCapital(l.split("_").join(" "))}`)
            if (perm.oldValue == false && perm.newValue == null) textLines.push(`🟥 >> ⬜ | ${makeOnlyFirstCapital(l.split("_").join(" "))}`)
        }
        if (textLines.length > 0) embed.addField(title, textLines.join("\n"))
    }
    embed.setFooter(newChannel.id)

    if (embed.embed.fields.length > 1 || nameChanged) server.sendLog('channelUpdate', {embeds: [embed.embed]}, null, null)
});

function makeOnlyFirstCapital(string: string): string {
    string = string.toLowerCase();
    let letters = string.split("")
    letters[0] = letters[0].toUpperCase()
    return letters.join('');
}