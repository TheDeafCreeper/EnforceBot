import { GuildMember } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('guildMemberRemove', async (guildMember: GuildMember) => {
    let server = await (new Server(guildMember.guild)).init();
    let member = await (new Member(server, guildMember.id)).init();

    let embed = new Embed()
    embed.setTitle(`Member Left`)
    embed.setAuthor(member)
    embed.setColor(0xff0000)
    embed.addField('Member Joined:', `<t:${toSec(guildMember.joinedTimestamp)}:f>`)
    embed.setFooter(guildMember.id)

    server.sendLog('guildMemberRemove', { embeds: [embed.embed] }, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}