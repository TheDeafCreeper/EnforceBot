import { Server } from "./Server";
import { NewsChannel, TextChannel, ThreadChannel } from "discord.js";
import { db } from "../run";
import { AntiSpamData, DynamicSlowmodeData, ModerationData, ChannelDetectionsData, AntiRaidData } from "../typings/Channel";
import { Detection, RepeatDetection, DetectionsData } from "../typings/Server";

const DefaultChannel = require("../defaults/Channel.json");

export class Channel {
    _id: string;
    guildID: string;
    channelID: string;
    name: string;
    topic: string;
    nsfw: boolean;
    antiSpam: AntiSpamData;
    antiRaid: AntiRaidData;
    dynamicSlowmode: DynamicSlowmodeData;
    threads: Array<string>;
    moderation: ModerationData;

    server: Server;
    channel: NewsChannel | TextChannel;

    constructor(server: Server, messageChannel: NewsChannel | TextChannel | ThreadChannel) {
        if (messageChannel.isThread()) messageChannel = messageChannel.parent;

        this._id = `${messageChannel.id}-${server._id}`;
        this.server = server;
        this.channel = messageChannel;
    }

    async init(): Promise<Channel> {
        let channelData = await db.read("Channels", this._id) as Channel;

        if (channelData == null) {
            channelData = JSON.parse(JSON.stringify(DefaultChannel));
            channelData._id = this._id;
            channelData.guildID = this.server._id;
            channelData.channelID = this.channel.id
        }

        channelData.name = this.channel.name;
        channelData.topic = this.channel.topic;
        channelData.nsfw = this.channel.nsfw;

        for (let i in channelData) this[i] = channelData[i];
        return this;
    }

    getDetections(): DetectionsData {
        const channelDetections = this.antiSpam?.detections as ChannelDetectionsData;
        const serverDetections = this.server.antiSpam.detections as DetectionsData;
        let combinedDetections: DetectionsData = {} as DetectionsData;

        for (let i in serverDetections) {
            if (channelDetections[i].synced) {
                combinedDetections[i] = serverDetections[i];
            } else {
                if (serverDetections[i]?.maxMultiplier) {
                    combinedDetections[i] = {
                        pressure: channelDetections[i].pressure,
                        threshold: channelDetections[i].threshold,
                        decay: serverDetections[i].decay,
                        actionGroup: channelDetections[i].actionGroup,
                        enabled: channelDetections[i].enabled,
                        maxMultiplier: channelDetections[i].maxMultiplier
                    } as RepeatDetection;
                } else {
                    combinedDetections[i] = {
                        pressure: channelDetections[i].pressure,
                        threshold: channelDetections[i].threshold,
                        decay: serverDetections[i].decay,
                        actionGroup: channelDetections[i].actionGroup,
                        enabled: channelDetections[i].enabled,
                    } as Detection;
                }
            }
        }

        return combinedDetections;
    }

    save(): void {
        const channelData = {
            _id: this._id,
            channelID: this.channelID,
            guildID: this.server._id,
            name: this.channel.name,
            topic: this.channel.topic,
            nsfw: this.channel.nsfw,
            antiSpam: this.antiSpam,
            dynamicSlowmode: this.dynamicSlowmode,
            threads: this.threads,
            moderation: this.moderation
        } as Channel;

        db.update("Channels", channelData._id, channelData);
    }
}