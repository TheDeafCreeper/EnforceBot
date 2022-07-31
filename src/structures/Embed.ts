import { ColorResolvable, MessageEmbed, EmbedFieldData } from 'discord.js';
import { Member } from './Member';

export class Embed {
    embed: MessageEmbed;

    constructor(data?: MessageEmbed) {
        if (data) this.embed = data;
        else this.embed = new MessageEmbed();

        this.embed.setTimestamp(Date.now());
    }

    setTitle(title: string): void {
        if (title.length > 256) title = `${title.substring(0, 253)}...`;

        this.embed.setTitle(title);
    }

    setDescription(description: string): void {
        if (description.length > 4096) description = `${description.substring(0, 4093)}...`;

        this.embed.setDescription(description);
    }

    setColor(color: ColorResolvable): void {
        this.embed.setColor(color);
    }

    setFooter(text: string, iconURL?: string): void {
        if (!text) text = ''
        if (text.length > 2048) text = `${text.substring(0, 2045)}...`;

        this.embed.setFooter({ text, iconURL});
    }

    setImage(url: string): void {
        this.embed.setImage(url);
    }

    setThumbnail(url: string): void {
        this.embed.setThumbnail(url);
    }

    setFields(fields: Array<EmbedFieldData>): void {
        this.embed.setFields(fields);
    }

    addField(name: string, value: string, inline?: boolean): void {
        if (name.length > 256) name = `${name.substring(0, 253)}...`;
        if (value.length > 1024) value = `${value.substring(0, 1021)}...`;

        if (name == '') { name = "\u200b"};
        if (value == '') { value = "\u200b"};

        this.embed.addField(name, value, inline);
    }

    addBlankField(inline?: boolean): void {
        this.addField("\u200b", "\u200b", inline);
    }

    setAuthor(member: Member) {
        this.embed.setAuthor({name: member.displayName??member.username, iconURL: member.avatarURL});
    }
}