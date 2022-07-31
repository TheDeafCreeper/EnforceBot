import { Server } from "./Server";
import { ThreadChannel } from "discord.js";
import { db } from "../run";
import { DynamicSlowmodeData, ModerationData } from "../typings/Thread";
import { DetectionsData } from "../typings/Server";
import { Channel } from "./Channel";

const DefaultThread = require("../defaults/Thread.json");

export class Thread {
    _id: string;
    threadID: string;
    channelID: string;
    guildID: string;
    owner: string;
    name: string;
    dynamicSlowmode: DynamicSlowmodeData;
    moderation: ModerationData;

    channel: Channel;
    server: Server;
    thread: ThreadChannel;

    constructor(channel: Channel, messageChannel: ThreadChannel) {
        this._id = `${messageChannel.id}-${channel._id}`;
        this.server = channel.server;
        this.thread = messageChannel;
        this.channel = channel;
    }

    async init(): Promise<Thread> {
        let threadData = await db.read("Threads", this._id) as Thread;

        if (threadData == null) {
            threadData = JSON.parse(JSON.stringify(DefaultThread));
            threadData._id = this._id;
            threadData.guildID = this.server._id;
            threadData.channelID = this.channel._id;
            threadData.threadID = this.thread.id

            db.insert("Threads", threadData);
        }

        threadData.name = this.thread.name;
        threadData.owner = this.thread.ownerId;

        for (let i in threadData) this[i] = threadData[i];
        return this;
    }

    getDetections(): DetectionsData {
        return this.channel.getDetections();
    }

    save(): void {
        const threadData = {
            _id: this._id,
            threadID: this.threadID,
            channelID: this.channelID,
            guildID: this.guildID,
            owner: this.owner,
            name: this.name,
            dynamicSlowmode: this.dynamicSlowmode,
            moderation: this.moderation
        } as Thread;

        db.update("Threads", threadData._id, threadData);
    }
}