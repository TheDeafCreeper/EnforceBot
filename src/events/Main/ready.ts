import { Event } from '../../structures/Event';
import { Bot } from '../../run';

const CONFIG = require("../config.json")

export default new Event('ready', () => {
    console.log('Enforce is online!')
    Bot.registerCommands({guildID: CONFIG.devID});
});