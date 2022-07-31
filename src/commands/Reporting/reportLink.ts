import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Bot } from '../../run';
import { TextChannel } from 'discord.js';

export default new Command({
    name: 'reportlink',
    description: 'Report a link as a malicious/safe.',
    options: [{
        name: 'link',
        description: 'The link to report.',
        type: 'STRING',
        required: true,
    },
    {
        name: 'safe',
        description: 'Mark this link as safe (false positive).',
        type: 'BOOLEAN',
        required: false,
    }],
    hidden: true,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let reporter = await (new Member(server, interaction.member.id)).init();
        let link = args.getString('link', true);
        let reportingSafe = args.getBoolean('safe', false);

        if (!reporter.canRunCommand('reportlink')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        Bot.guilds.fetch('695896437195538432').then(guild => {
            let channel = guild.channels.resolve('937174698217836544') as TextChannel
            if (reportingSafe) channel.send(`\`${link}\` has been reported as a **safe** link by <@${reporter._id}> (${reporter._id}).`);
            else channel.send(`\`${link}\` has been reported as a **malicious** link by <@${reporter._id}> (${reporter._id}).`);
        })

        if (reportingSafe) interaction.editReply(`${link} has been reported as a safe link.`);
        else interaction.editReply(`${link} has been reported as a malicious link.`)
    }
})