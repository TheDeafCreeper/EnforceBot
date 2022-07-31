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

export default new Event('roleCreate', async (role: Role) => {
    let server = await (new Server(role.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Role Created`)
    embed.setColor(0x00ff00)

    if (role.iconURL()) embed.setThumbnail(role.iconURL())

    embed.addField(`Role Name:`, role.name)
    let info = ""
    info += `Created At: <t:${toSec(role.createdTimestamp)}:f>\n`
    info += `Color: ${role.hexColor}\n`
    info += `Displayed Separately: ${role.hoist ? "Yes" : "No"}\n`
    info += `Mentionable: ${role.mentionable ? "Yes" : "No"}\n`
    info += `Position: ${role.position}`

    embed.addField(`Role Info:`, info)

    // Add Permissions
    let perms = []
    role.permissions.toArray().forEach(perm => {
        perms.push(perm)
    })

    let normalPerms = []
    let dangerousPerms = []
    let criticalPerms = []

    for (let i = 0; i < perms.length; i++) {
        if (permLabels.normal.includes(perms[i])) {
            normalPerms.push(makeOnlyFirstCapital(perms[i].split("_").join(" ")))
        } else if (permLabels.dangerous.includes(perms[i])) {
            dangerousPerms.push(makeOnlyFirstCapital(perms[i].split("_").join(" ")))
        } else {
            criticalPerms.push(makeOnlyFirstCapital(perms[i].split("_").join(" ")))
        }
    }

    if (criticalPerms.length > 0) embed.addField(`__**Critical Permissions**__:`, criticalPerms.join(", "))
    if (dangerousPerms.length > 0) embed.addField(`**Dangerous Permissions**:`, dangerousPerms.join(", "))

    if (normalPerms.length > 0) embed.addField(`Normal Permissions:`, normalPerms.join(", "))
    else embed.addField(`Normal Permissions:`, "None")

    embed.setFooter(role.id)

    server.sendLog('roleCreate', {embeds: [embed.embed]}, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}

function makeOnlyFirstCapital(string) {
    string = string.toLowerCase();
    string = string.split('')
    string[0] = string[0].toUpperCase();
    return string.join('');
}