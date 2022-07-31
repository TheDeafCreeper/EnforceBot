import { PermissionOverwrites } from "discord.js";

export interface DynamicSlowmodeData {
    enabled: boolean;
    sync: boolean;
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