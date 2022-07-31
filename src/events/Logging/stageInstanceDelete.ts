import { StageInstance } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('stageInstanceDelete', async (stageInstance: StageInstance) => {
    let server = await (new Server(stageInstance.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Stage Topic "${stageInstance.topic}" Ended`)
    embed.setColor(0xff0000)

    embed.addField(`Stage Topic:`, stageInstance.topic)
    embed.addField(`Stage Channel:`, `<#${stageInstance.channelId}>`)
    embed.addField(`Discoverable:`, stageInstance.discoverableDisabled ? "No" : "Yes")
    embed.addField(`Privacy Level:`, makeOnlyFirstCapital(stageInstance.privacyLevel.split("_").join(" ")))

    server.sendLog('stageInstanceDelete', {embeds: [embed.embed]}, null, null)
});

function makeOnlyFirstCapital(string: string): string {
    string = string.toLowerCase();
    let letters = string.split("")
    letters[0] = letters[0].toUpperCase()
    return letters.join('');
}