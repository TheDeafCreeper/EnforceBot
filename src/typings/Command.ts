import { ChatInputApplicationCommandData, CommandInteraction, CommandInteractionOptionResolver, GuildMember } from "discord.js";
import { ExtendedClient } from "../structures/Client";

interface RunOptions {
    client: ExtendedClient,
    interaction: ExtendedInteraction,
    args: CommandInteractionOptionResolver
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
    hidden: boolean;
    run: RunFunction;
} & ChatInputApplicationCommandData

export interface ExtendedInteraction extends CommandInteraction {
    member: GuildMember;
}