import { GuildMember } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Member } from '../../structures/Member';

export default new Event('guildMemberAdd', async (guildMember: GuildMember) => {
    let server = await (new Server(guildMember.guild)).init();
    let member = await (new Member(server, guildMember.id)).init();

    let joinGroup = server.joinGroups.groups?.[server.joinGroups.count];
    if (!joinGroup) joinGroup = {
            number: server.joinGroups.count,
            created: Date.now(),
            users: [member._id],
            trustOffset: 0
        }
    else if (joinGroup.created + 1800000 < Date.now()) {
        server.joinGroups.count++;
        joinGroup = {
            number: server.joinGroups.count,
            created: Date.now(),
            users: [member._id],
            trustOffset: 0
        }
    } else joinGroup.users.push(member._id);

    let existingUsers = [];
    joinGroup.users = joinGroup.users.filter(user => {
        if (existingUsers.includes(user)) return false;
        existingUsers.push(user);
        return true;
    });

    if (!server.joinGroups.groups) server.joinGroups.groups = [];
    server.joinGroups.groups[server.joinGroups.count] = joinGroup;
    member.joinGroup = joinGroup.number;

    server.save();
    member.save();
});