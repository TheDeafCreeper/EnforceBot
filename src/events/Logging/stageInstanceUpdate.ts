import { StageInstance } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('stageInstanceUpdate', async (oldStageInstance: StageInstance, newStageInstance: StageInstance) => {
    let server = await (new Server(oldStageInstance.guild)).init();

    let embed = new Embed()
    embed.setTitle(`Stage Topic "${oldStageInstance.topic}" Updated`)
    embed.setColor(0xffff00)

    if (oldStageInstance.topic !== newStageInstance.topic) embed.addField(`Stage Topic:`, `${oldStageInstance.topic} >> ${newStageInstance.topic}`)
    if (oldStageInstance.channelId !== newStageInstance.channelId) embed.addField(`Stage Channel:`, `<#${oldStageInstance.channelId}> >> <#${newStageInstance.channelId}>`)
    if (oldStageInstance.discoverableDisabled !== newStageInstance.discoverableDisabled)
        embed.addField(`Discoverable:`, `${oldStageInstance.discoverableDisabled ? "No" : "Yes"} >> ${newStageInstance.discoverableDisabled ? "No" : "Yes"}`)
    if (oldStageInstance.privacyLevel !== newStageInstance.privacyLevel)
        embed.addField(`Privacy Level:`,
        `${makeOnlyFirstCapital(oldStageInstance.privacyLevel.split("_").join(" "))} >> ${makeOnlyFirstCapital(newStageInstance.privacyLevel.split("_").join(" "))}`)

    server.sendLog('stageInstanceUpdate', {embeds: [embed.embed]}, null, null)
});

function makeOnlyFirstCapital(string: string): string {
    string = string.toLowerCase();
    let letters = string.split("")
    letters[0] = letters[0].toUpperCase()
    return letters.join('');
}