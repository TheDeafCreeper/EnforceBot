import { Command } from "../../structures/Command";
import { Embed } from "../../structures/Embed";

export default new Command({
    name: 'botinfo',
    description: 'Information on Enforce!',
    options: [],
    hidden: false,
    run: async({ client, interaction }) => {
        let embed = new Embed();
        embed.setTitle(`Enforce [Prototype]`);

        const descriptions = [
            `A moderation bot made for servers, not proft.`,
            `Moderate your server without needing to support crypto.`,
            `A moderation bot that give you access to all the things you need, for free.`
        ]

        embed.setDescription(descriptions[Math.floor(Math.random() * descriptions.length)]);
        embed.setColor(0xfc03e8);
        embed.setThumbnail(client.user.displayAvatarURL());

        embed.addField(`Bot Started:`, `<t:${Math.floor((Date.now() - client.uptime)/1000)}:R>`, true);
        embed.addField(`Server Count`, `${client.guilds.cache.size}`, true);
        embed.addField(`Developer`, `TheDeafCreeper#0001`);
        embed.addField(
            `Support`,
            `Need some help?\nWant to appeal a raider status?\nRecovered your account after a hack?\nFeel free to head over to the [Support Server](https://discord.gg/C3wCK8Fxzs)!`
        );
        embed.addField(
            `Invite`,
            `Want Enforce for yourself? Invite me [here](https://discord.com/oauth2/authorize?client_id=${interaction.guild.me.id}&scope=bot%20applications.commands&permissions=8)!`
        );

        interaction.editReply({
            embeds: [embed.embed],
        });
    }
})