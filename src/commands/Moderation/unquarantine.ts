import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';

export default new Command({
    name: 'unquarantine',
    description: 'Unquarantine a user.',
    options: [{
        name: 'target',
        description: 'The user to unquarantine.',
        type: 'USER',
        required: true,
    }],
    hidden: true,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('unquarantine')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let target = await (new Member(server, args.getUser('target', true).id)).init();
        target.timeout(0, 'Unquarantine by ' + actor.displayName);

        let role = await server.fetchQuaratinedRole();
        if (target.member.roles.cache.has(role.id)) await target.member.roles.remove(role);
        target.member.roles.add(target.moderation.removedRoles);
        
        interaction.editReply({
            content: `<@${target._id}> has been unquarantine.`,
        })
    }
})