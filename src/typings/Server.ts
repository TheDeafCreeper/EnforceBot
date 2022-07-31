// AntiSpam

import { PunishmentAction } from "./Punishment";

export interface Detection {
    pressure: number;
    threshold: number;
    decay: number;
    actionGroup: string;
    enabled: boolean;
}

export interface RepeatDetection extends Detection {
    maxMultiplier: number;
}

export interface DetectionsData {
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
    detections: DetectionsData;
}

//AntiRaid

interface RaidStartActions {
    users: PunishmentAction;
    channels: 'Nothing'|'Lockdown';
}

export interface AntiRaidData {
    joinGroupTimeframe: number;
    joinGroupWarningSize: number;
    rapidPunishmentTimeframe: number;
    raidStartActions: RaidStartActions;
    revertActionsOnRaidEnd: boolean;
    enabled: boolean;
}

// Joingate

interface JoinGateType {
    enabled: boolean;
    actionGroup: string;
}

interface NewAccountType extends JoinGateType {
    threshold: number;
}

interface JoinSpamType extends JoinGateType {
    threshold: number;
}

export interface JoinGateData {
    defaultAvatar: JoinGateType;
    advertisementName: JoinGateType;
    newAccount: NewAccountType;
    inappropriateName: JoinGateType;
    joinSpam: JoinSpamType;
    unverifiedBot: JoinGateType;
    verifiedBot: JoinGateType;
    mutedUser: JoinGateType;
    quarantinedUser: JoinGateType;
}

// Moderation

interface ReportOptions {
    enabled: boolean;
    channel: string;
    pingedRoles: Array<string>;
    blacklistedUsers: Array<string>;
    allowAnonymous: boolean;
}

export interface ModerationData {
    staffRoles: Array<string>;
    reports: ReportOptions;
    quarantineRole: string;
}

// Action Groups

interface StoredPunishmentAction {
    actions: PunishmentAction,
    reason: string,
    canSkip: boolean
}

export interface ActionGroups {
    [key: string]: StoredPunishmentAction[];
}

// Logging

interface LoggingChannels {
    [key: string]: string;
}

interface LoggingEventCategories {
    messageUpdate: string;
    messageDelete: string;
    messageDeleteBulk: string;
    messageReactionRemoveAll: string;

    channelCreate: string;
    channelDelete: string;
    channelUpdate: string;
    channelPinsUpdate: string;

    emojiCreate: string;
    emojiDelete: string;
    emojiUpdate: string;

    guildBanAdd: string;
    guildBanRemove: string;
    punishmentExecuted: string;

    guildMemberAdd: string;
    guildMemberRemove: string;

    guildMemberUpdate: string;

    guildUpdate: string;

    inviteCreate: string;
    inviteDelete: string;

    roleCreate: string;
    roleDelete: string;
    roleUpdate: string;

    stageInstanceCreate: string;
    stageInstanceDelete: string;
    stageInstanceUpdate: string;

    stickerCreate: string;
    stickerDelete: string;
    stickerUpdate: string;

    threadCreate: string;
    threadDelete: string;
    threadUpdate: string;
}

export interface LoggingOptions {
    enabled: boolean;
    ignoredChannels: Array<string>;
    ignoredMembers: Array<string>;
    channels: LoggingChannels;
    eventCategories: LoggingEventCategories;
}

interface JoinGroup {
    number: number;
    created: number;
    users: Array<string>;
    trustOffset: number;
}

export interface JoinGroupData {
    count: number;
    groups: JoinGroup[];
}

export interface MemberData {
    trust: number;
    id: string;
    nickname: string;
    username: string;
    displayName: string;
    discriminator: string;
    activePunishmentCount: string;
}

interface Permission {
    id: string;
    type: 'User'|'Role';

    //Info Commands
    botinfo: boolean;

    //Moderation Commands
    ban: boolean;
    history: boolean;
    kick: boolean;
    modinfo: boolean;
    mute: boolean;
    notes: boolean;
    quarantine: boolean;
    softban: boolean;
    unmute: boolean;
    unqurantine: boolean;
    warn: boolean;

    report: boolean;
}