import { Event } from '../../structures/Event';
import { Bot } from '../../run';
import { CommandInteractionOptionResolver } from 'discord.js';
import { ExtendedInteraction } from '../../typings/Command';

export default new Event('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        try {
            const command = Bot.commands.get(interaction.commandName);
            if (!command) return interaction.editReply("Command not found!");
            if (command.hidden) await interaction.deferReply({ ephemeral: true }).catch(err => { console.error(err) });
            else await interaction.deferReply().catch(err => { console.error(err) });

            command.run({
                args: interaction.options as CommandInteractionOptionResolver,
                client: Bot,
                interaction: interaction as ExtendedInteraction
            })
        } catch (err) {
            console.error(err);
            if (interaction.replied) interaction.editReply(`An error occurred while running the command.`);
            else interaction.channel.send(`An error occurred while running the command.`);
        }
    }
})