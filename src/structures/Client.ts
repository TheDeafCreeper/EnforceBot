import { ApplicationCommandDataResolvable, Client, Collection, ClientEvents } from 'discord.js';
import { CommandType } from '../typings/Command';
import glob from 'glob';
import { promisify } from 'util';
import { RegiserCommandsOptions } from '../typings/Client';
import { Event } from './Event';
import { db } from '../run';

const CONFIG = require("../config.json")

const globAsync = promisify(glob);

export class ExtendedClient extends Client {
    commands: Collection<string, CommandType> = new Collection()

    constructor() {
        super({ intents: 32767 });
    }

    start() {
        console.log('Starting...')
        this.registerModules().then(() => {
            console.log('Events Registered')
            this.login(CONFIG.token).then(() => {
                console.log('Started')
            });
        });
    }

    async importFile(filePath: string) {
        return (await import(filePath))?.default;
    }

    async registerCommands({ guildID }: RegiserCommandsOptions) {
        let slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = await globAsync(`${__dirname}/../commands/*/*{.ts,.js}`);

        for (let i in commandFiles) {
            const filePath = commandFiles[i];
            const command: CommandType = await this.importFile(filePath);
            if (!command.name) continue;

            this.commands.set(command.name, command)
            slashCommands.push(command)
        }

        if (guildID) {
            this.guilds.fetch(guildID).then(guild => {
                guild.commands.set(slashCommands).then(() => {
                    console.log('Registered commands to guild:', guildID);
                }).catch(err => {
                    console.log(slashCommands)
                    console.log('Failed to register commands to guild:', guildID, err);
                })
            }).catch(err => {
                console.log('Failed to find guild:', guildID, err);
            })
        } else {
            this.application.commands.set(slashCommands);
            console.log('Registered commands globally.');
        }
    };

    async registerModules() {

        // Commands

        let slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = await globAsync(`${__dirname}/../commands/*/*{.ts,.js}`);

        for (let i in commandFiles) {
            const filePath = commandFiles[i];
            const command: CommandType = await this.importFile(filePath);
            if (!command.name) continue;

            this.commands.set(command.name, command)
            slashCommands.push(command)
        }
        
        //this.registerCommands({ commands: slashCommands, guildID: process.env.devID });

        // Events

        const eventFiles = await globAsync(`${__dirname}/../events/*/*{.ts,.js}`);
        eventFiles.forEach(async filePath => {
            const event: Event<keyof ClientEvents> = await this.importFile(filePath);
            this.on(event.event, event.run)
        })
    }
}