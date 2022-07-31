import { Sticker } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('stickerCreate', async (sticker: Sticker) => {
    let server = await (new Server(sticker.guild)).init();
    let member = await (new Member(server, sticker.user.id)).init();

    let embed = new Embed()
    embed.setTitle(`Sticker Created`)
    embed.setColor(0x00ff00)
    embed.setAuthor(member)

    embed.addField(`Sticker Name:`, sticker.name)
    embed.addField(`Description:`, sticker.description)
    embed.addField(`Created:`, `<t:${toSec(sticker.createdTimestamp)}:f>`)
    embed.addField(`Animated:`, sticker.format == "APNG" ? "Yes" : "No")
    embed.setImage(sticker.url)
    embed.setFooter(sticker.id)

    server.sendLog('stickerCreate', {embeds: [embed.embed]}, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}