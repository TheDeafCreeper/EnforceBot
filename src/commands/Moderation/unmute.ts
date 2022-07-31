import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';

export default new Command({
    name: 'unmute',
    description: 'Unmute a user.',
    options: [{
        name: 'target',
        description: 'The user to unmute.',
        type: 'USER',
        required: true,
    }],
    hidden: true,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('unmute')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let target = await (new Member(server, args.getUser('target', true).id)).init();
        target.timeout(0, 'Unmuted by ' + actor.displayName);

        interaction.editReply({
            content: `<@${target._id}> has been unmuted.`,
        })
    }
})