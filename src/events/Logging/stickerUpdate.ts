import { Sticker } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('stickerUpdate', async (oldSticker: Sticker, newSticker: Sticker) => {
    let server = await (new Server(oldSticker.guild)).init();
    let member = await (new Member(server, oldSticker.user.id)).init();

    let embed = new Embed()
    embed.setTitle(`Sticker Updated`)
    embed.setColor(0xffff00)
    embed.setAuthor(member)

    let nameChanged = false
    if (oldSticker.name != newSticker.name) {embed.addField(`Sticker Name:`, `${oldSticker.name} >> ${newSticker.name}`); nameChanged = true}
    else embed.addField(`Sticker Name:`, newSticker.name)

    if (oldSticker.description != newSticker.description) 
        embed.addField(`Description:`, `${oldSticker.description} >> ${newSticker.description}`); 

    embed.setImage(oldSticker.url)
    embed.setFooter(oldSticker.id)

    server.sendLog('stickerUpdate', {embeds: [embed.embed]}, null, null)
});