import { Role } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

const permLabels = {
    normal: [
        'ADD_REACTIONS',
        'PRIORITY_SPEAKER',
        'STREAM',
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'SEND_TTS_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'READ_MESSAGE_HISTORY',
        'MENTION_EVERYONE',
        'CONNECT',
        'SPEAK',
        'CHANGE_NICKNAME',
        'USE_APPLICATION_COMMANDS',
        'REQUEST_TO_SPEAK',
        'CREATE_PUBLIC_THREADS',
        'CREATE_PRIVATE_THREADS',
        'USE_EXTERNAL_STICKERS',
        'SEND_MESSAGES_IN_THREADS',
        'USE_PUBLIC_THREADS',
        'USE_PRIVATE_THREADS',
        'USE_VAD',
        'USE_EXTERNAL_EMOJIS'
    ],
    dangerous: [
        'CREATE_INSTANT_INVITE',
        'KICK_MEMBERS',
        'MANAGE_CHANNELS',
        'VIEW_AUDIT_LOG',
        'MANAGE_MESSAGES',
        'MENTION_EVERYONE',
        'VIEW_GUILD_INSIGHTS',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
        'MANAGE_NICKNAMES',
        'MANAGE_ROLES',
        'MANAGE_EMOJIS_AND_STICKERS',
        'MANAGE_EVENTS',
        'MANAGE_THREADS',
        'START_EMBEDDED_ACTIVITIES',
        'MODERATE_MEMBERS'
    ],
    critical: [
        'BAN_MEMBERS',
        'ADMINISTRATOR',
        'MANAGE_GUILD',
        'MANAGE_WEBHOOKS'
    ]
}

export default new Event('roleUpdate', async (oldRole: Role, newRole: Role) => {
    let server = await (new Server(oldRole.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Role Updated`)
    embed.setColor(0xffff00)

    let nameChanged = false
    if (oldRole.name != newRole.name) { embed.addField(`Role Name:`, `${oldRole.name} >> ${newRole.name}`); nameChanged = true; }
    else embed.addField(`Role Name:`, newRole.name)

    if (oldRole.hexColor != newRole.hexColor) embed.addField(`Color:`, `${oldRole.hexColor} >> ${newRole.hexColor}`)
    if (oldRole.hoist != newRole.hoist) embed.addField(`Displayed Separately:`, `${oldRole.hoist ? "Yes" : "No"} >> ${newRole.hoist ? "Yes" : "No"}`)
    if (oldRole.mentionable != newRole.mentionable) embed.addField(`Mentionable:`, `${oldRole.mentionable ? "Yes" : "No"} >> ${newRole.mentionable ? "Yes" : "No"}`)
    if (oldRole.position != newRole.position) embed.addField(`Position:`, `${oldRole.position} >> ${newRole.position}`)

    let oldPerms = oldRole.permissions.toArray()
    let newPerms = oldRole.permissions.toArray()

    let removedPerms = []
    let addedPerms = []

    oldPerms.forEach(perm => {
        if (!newPerms.includes(perm)) removedPerms.push(perm)
    })

    newPerms.forEach(perm => {
        if (!oldPerms.includes(perm)) addedPerms.push(perm)
    })

    let text = ``
    removedPerms.forEach(perm => {
        if (text != ``) text += `\n`
        text += `🟩 >> 🟥 | ${makeOnlyFirstCapital(perm.split("_").join(" "))}`
    })
    addedPerms.forEach(perm => {
        if (text != ``) text += `\n`
        if (permLabels.dangerous.includes(perm)) text += `*Dangerous*`
        else if (permLabels.critical.includes(perm)) text += `*Critical*`
        text += `🟥 >> 🟩 | ${makeOnlyFirstCapital(perm.split("_").join(" "))}`
    })

    if (text != '') embed.addField(`Permissions:`, text)

    if (embed.embed.fields.length > 1 || nameChanged) server.sendLog('roleUpdate', {embeds: [embed.embed]}, null, null)
});

function makeOnlyFirstCapital(string) {
    string = string.toLowerCase();
    string = string.split('')
    string[0] = string[0].toUpperCase();
    return string.join('');
}