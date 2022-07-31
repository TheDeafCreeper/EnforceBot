import { NonThreadGuildBasedChannel } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('channelCreate', async (guildChannel: NonThreadGuildBasedChannel) => {
    let server = await (new Server(guildChannel.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Channel Created`)
    embed.setColor(0x00ff00)

    if (guildChannel.parent) embed.addField(`Category:`, guildChannel.parent.name)
    embed.addField(`Channel Name:`, guildChannel.name)
    embed.addField(`Channel Type:`, guildChannel.type)

    let permGroups = []
    guildChannel.permissionOverwrites.cache.forEach(value => permGroups.push(value))

    for (let l = 0; l < permGroups.length; l++) {
        if (embed.embed.fields.length >= 24) break;

        let permsText = ""
        let perms = [...permGroups[l].allow.toArray(), ...permGroups[l].deny.toArray()]
        let denyIndex = permGroups[l].allow.length

        for (let i = 0; i < perms.length; i++) {
            if (permsText != "") permsText += "\n"
            if (i < denyIndex) {
                permsText += `🟩 | ${makeOnlyFirstCapital(perms[i].split("_").join(" "))}`
            } else {
                permsText += `🟥 | ${makeOnlyFirstCapital(perms[i].split("_").join(" "))}`
            }
        }

        if (permsText == "") permsText = "None"

        if (permGroups[l].type == "role") {
            let role = guildChannel.guild.roles.resolve(permGroups[l].id)
            embed.addField(`Overwrites for @${role.name}`, permsText)
        } else {
            let member = guildChannel.guild.members.resolve(permGroups[l]._id)
            embed.addField(`Overwrites for @${member.displayName}`, permsText)
        }
    }

    if (guildChannel.permissionOverwrites.cache.size > 24) embed.setFooter(`+ ${guildChannel.permissionOverwrites.cache.size - 24} more roles.`)
    embed.setFooter(guildChannel.id)

    server.sendLog('channelCreate', {embeds: [embed.embed]}, null, null)
});

function makeOnlyFirstCapital(string: string): string {
    string = string.toLowerCase();
    let letters = string.split("")
    letters[0] = letters[0].toUpperCase()
    return letters.join('');
}