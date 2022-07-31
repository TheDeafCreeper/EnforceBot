import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { Bot } from '../../run';
import { TextChannel } from 'discord.js';

export default new Command({
    name: 'reportraider',
    description: 'Report a user as a raider.',
    options: [{
        name: 'user',
        description: 'The user to report.',
        type: 'USER',
        required: true,
    }],
    hidden: true,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let reporter = await (new Member(server, interaction.member.id)).init();
        let reported = await (new Member(server, args.getUser('user', true).id)).init();

        if (!reporter.canRunCommand('reportraider')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        if (reported.isRaider) {
            interaction.editReply(`This user is already marked as a raider!`);
            return;
        }

        let recentMessages = reported.recentMessages;
        let reversedMessages = recentMessages.slice().reverse();
        let messages = [];

        reversedMessages.forEach(message => {
            if (messages.length >= 5) return;
            messages.push(`${message.content}`);
        });

        let embed = new Embed();
        embed.setTitle(`User reported as a raider.`);
        embed.setColor(0xff0000)
        embed.setDescription(`<@${reported._id}> has been reported as a raider.`);
        embed.addField(`Reporter`, `<@${reporter._id}> (${reporter._id})`);
        embed.addField(`Messages:`, messages.reverse().join('\n'))

        Bot.guilds.fetch('695896437195538432').then(guild => {
            (guild.channels.resolve('937086011291349012') as TextChannel).send({
                embeds: [embed.embed]
            });
        })

        interaction.editReply({
            content: `<@${reported._id}> has been reported as a raider.`,
        })
    }
})