import { GuildMember } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildMemberAdd', async (guildMember: GuildMember) => {
    let server = await (new Server(guildMember.guild)).init();
    let member = await (new Member(server, guildMember.id)).init();

    let embed = new Embed()
    embed.setTitle(`Member Joined`)
    embed.setAuthor(member)
    embed.setColor(0x00ff00)

    let createdString = ""
    if (Date.now() - member.user.createdTimestamp < server.joinGate.newAccount.threshold) createdString = `⚠️ **NEW ACCOUNT** ⚠️\n`
    createdString += `<t:${toSec(member.user.createdTimestamp)}:f>`

    embed.addField(`Account Created:`, createdString)
    embed.setFooter(member._id)

    server.sendLog('guildMemberAdd', { embeds: [embed.embed] }, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}