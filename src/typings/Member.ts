import { RoleResolvable, MessageResolvable } from "discord.js";

export interface MemberData { 
    _id: string;
    username: string;
    discriminator: string;
    avatarURL: string;

    trustRating: number;
    servers: Array<string>;
    isCompromised: boolean;
    isRaider: boolean;
    serviceBlacklisted: boolean;
}

export interface ServerMemberData {
    _id: string;
    memberID: string;
    guildID: string;

    displayName: string;
    nickname: string;
    firstJoin: number;
    messageCount: number;

    antiSpam: AntiSpamData;
    actionStages: ActionStageData;
    activeThreads: Array<string>;
    inactiveThreads: Array<string>;
    moderation: ModerationData;
    roles: Array<string>;
    recentMessages: Array<RecentMessageData>;
    joinGroup: number;
}

interface Pressures {
    [key: string]: number;
}

export interface AntiSpamData {
    pressures: Pressures;
}

interface ActionStage {
    stage: number;
    time: number;
}

export interface ActionStageData {
    [key: string]: ActionStage;
}

export interface HistoryEntry {
    type: 'Warning' | 'Mute' | 'Quarantine' | 'Kick' | 'SoftBan' | 'Ban';
    actor: string;
    reason: string;
    expires: number;
    duration: number;
    time: number;
}

export interface Note {
    author: string;
    note: string;
}

export interface ModerationData {
    wasKickedorBanned: boolean;
    history: Array<HistoryEntry>;
    removedRoles: Array<RoleResolvable>;
    notes: Array<Note>;
    recentJoins: Array<number>;
}

export interface RecentMessageData {
    id: MessageResolvable;
    content: string;
    timestamp: number;
}