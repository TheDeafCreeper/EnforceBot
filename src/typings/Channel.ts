import { PermissionOverwrites } from "discord.js";

interface Detection {
    threshold: number;
    actionGroup: string;
    synced: boolean;
    enabled: boolean;
}

interface RepeatDetection extends Detection {
    maxMultiplier: number;
}

export interface ChannelDetectionsData {
    total: Detection;
    message: Detection;
    length: Detection;
    repeat: RepeatDetection;
    invite: Detection;
    nsfw: Detection;
    emoji: Detection;
    sticker: Detection;
    newline: Detection;
    inactive: Detection;
    mentionUser: Detection;
    mentionRole: Detection;
    mentionEveryone: Detection;
    embed: Detection;
    file: Detection;
    image: Detection;
    link: Detection;
    short: Detection;
    spoiler: Detection;
    walloftext: Detection;
    caps: Detection;
    zalgo: Detection;
}

export interface AntiSpamData {
    enabled: boolean;
    detections: ChannelDetectionsData;
}

export interface AntiRaidData {
    recentTalkers: string[];
    recentMessages: string[];
}

export interface DynamicSlowmodeData {
    enabled: boolean;
    sendMessages: boolean;
    lastUpdate: number;
    targetMessageCount: number;
    targetMessageTime: number;
    currentMessageRate: Array<number>;
    overriden: boolean;
}

export interface ModerationData {
    locked: boolean;
    oldOverrides: PermissionOverwrites;
}