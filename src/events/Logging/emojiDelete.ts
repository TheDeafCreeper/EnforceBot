import { GuildEmoji } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';
import { Member } from '../../structures/Member';

export default new Event('emojiDelete', async (emoji: GuildEmoji) => {
    let server = await (new Server(emoji.guild)).init();
    let member = await (new Member(server, emoji.author.id)).init();

    let embed = new Embed()
    embed.setTitle(`Emoji Deleted`)
    embed.setColor(0xff0000)

    embed.addField(`Emoji Name:`, emoji.name)
    embed.addField(`Created:`, `<t:${toSec(emoji.createdTimestamp)}:f>`)
    embed.addField(`Deleted:`, `<t:${toSec(Date.now())}:f>`)
    embed.addField(`Animated:`, emoji.animated ? "Yes" : "No")
    embed.setImage(emoji.url)
    embed.setFooter(emoji.id)

    server.sendLog('emojiDelete', {embeds: [embed.embed]}, null, null)
});

function toSec(num) {
    return Math.floor(num / 1000)
}