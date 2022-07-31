import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';

export default new Command({
    name: 'trustbreakdown',
    description: 'See the trust breakdown for a user.',
    options: [{
        name: 'user',
        description: 'The user to get a trust breakdown for.',
        type: 'USER',
        required: true,
    }],
    hidden: false,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('modinfo')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let user = await (new Member(server, args.getUser('user', true).id)).init();

        let embed = new Embed();

        embed.setTitle(`Mod Info on ${user.displayName}`);
        embed.setColor(0xffff00);
        embed.setThumbnail(user.avatarURL);

        const trustValue = user.getTrust();
        const trustBreakdown = user.getTrustBreakdown();
        let trustString = `${trustValue}`

        if (trustValue > 70) trustString += ` | **Perfect**`;
        else if (trustValue > 60) trustString += ` | Excellent`
        else if (trustValue > 40) trustString += ` | Great`
        else if (trustValue > 20) trustString += ` | Good`
        else if (trustValue > 0) trustString += ` | Okay`
        else if (trustValue > -10) trustString += ` | Poor`
        else if (trustValue > -20) trustString += ` | Bad`
        else if (trustValue > -30) trustString += ` | Very Bad`
        else if (trustValue > -40) trustString += ` | Terrible`
        else trustString += ` | **Atrocious**`
        
        embed.addField(`Trust Rating`, trustString);

        let breakdownString = ''
        breakdownString += `Base Trust: ${trustBreakdown.base}`
        breakdownString += `\nAccount Age: ${trustBreakdown.age}`
        breakdownString += `\nMember Joined: ${trustBreakdown.join}`
        breakdownString += `\nMessages Sent: ${trustBreakdown.message}`
        breakdownString += `\nTime between punishments: ${trustBreakdown.timeBetweenPunishments}`
        breakdownString += `\nPunishments: ${trustBreakdown.punishments}`
        breakdownString += `\nUser Badges: ${trustBreakdown.badges}`
        breakdownString += `\nJoin Group Size: ${trustBreakdown.joinGroupSize}`
        breakdownString += `\nJoin Group Punishments: ${trustBreakdown.joinGroupPunishments}`
        breakdownString += `\nAccount Compromised: ${trustBreakdown.compromised}`
        breakdownString += `\nKnown Raider: ${trustBreakdown.raider}`
        breakdownString += `\nLink/Compromised Report Blacklisted: ${trustBreakdown.reportBlacklisted}`
        breakdownString += `\n\n(Total - 100 = Trust Rating)`
        embed.addField(`Trust Breakdown`, breakdownString)

        interaction.editReply({
            embeds: [embed.embed]
        }).catch(err => {});
    }
})