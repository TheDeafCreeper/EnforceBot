import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';

export default new Command({
    name: 'reportblackliststatus',
    description: 'Set\'s a user\'s report blacklist status.',
    options: [{
        name: 'user',
        description: 'The user to set the report blacklist status for.',
        type: 'USER',
        required: true,
    },
    {
        name: 'status',
        description: 'The status to set the user to.',
        type: 'BOOLEAN',
        required: true,
    }],
    hidden: true,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let user = await (new Member(server, interaction.member.id)).init();
        let target = await (new Member(server, args.getUser('user', true).id)).init();

        if (!user.canRunCommand('reportblackliststatus')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        target.reportBlacklisted = args.getBoolean('status');
        target.save();

        if (target.reportBlacklisted) interaction.editReply(`<@${target._id}> has been blacklisted from making reports.`)
        else interaction.editReply(`<@${target._id}> has been unblacklisted from making reports.`)
    }
})