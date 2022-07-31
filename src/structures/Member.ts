import { Server } from './Server';
import { Guild, GuildMember, User } from 'discord.js';
import { AntiSpamData, ActionStageData, ModerationData, RecentMessageData, MemberData, ServerMemberData, HistoryEntry } from '../typings/Member';
import { db, Bot } from '../run';
import { ScheduledEventOptions, RefreshTimeoutData } from '../typings/ScheduledEvents';
import { ScheduledEvent } from './ScheduledEvent';

const DefaultMember = require('../defaults/Member.json');
const DefaultServerMember = require('../defaults/ServerMember.json');

export class Member {
    // Non Guild Data

    _id: string;
    username: string;
    discriminator: string;
    avatarURL: string;

    trustOffset: number;

    trustRating: number;
    servers: Array<string>;
    isCompromised: boolean;
    isRaider: boolean;
    serviceBlacklisted: boolean;
    reportBlacklisted: boolean;

    // Guild Data
    server: Server;
    guild: Guild;
    member: GuildMember;
    user: User;
    displayName: string;
    nickname: string;
    firstJoin: number;
    messageCount: number;

    joinGroup: number;

    antiSpam: AntiSpamData;
    actionStages: ActionStageData;
    activeThreads: Array<string>;
    inactiveThreads: Array<string>;
    moderation: ModerationData;
    roles: Array<string>;
    recentMessages: Array<RecentMessageData>;

    debug: any[];

    //Temp Data
    tempMember: Promise<GuildMember>;
    tempUser: Promise<User>;

    constructor(server: Server, memberID: string) {
        this.tempMember = server.guild.members.fetch(memberID);
        this.tempUser = Bot.users.fetch(memberID);
        this.server = server
        this.guild = server.guild;
        this._id = memberID;
    }

    async init(): Promise<Member> {
        try { this.member = await this.tempMember as GuildMember; } catch (err) { this.member = null as GuildMember; }
        this.user = await this.tempUser as User;

        delete this.tempMember;
        delete this.tempUser;

        let memberData = await db.read("Members", this._id) as MemberData;
        let serverMemberData = await db.read("ServerMembers", `${this._id}-${this.guild.id}`) as ServerMemberData;

        // Create Member Data if it doesn't exist
        if (memberData == null) {
            memberData = JSON.parse(JSON.stringify(DefaultMember));
            memberData._id = this.member?.id;

            db.insert("Members", memberData);
        }

        // Create ServerMemberData if it doesn't exist
        if (serverMemberData == null) {
            serverMemberData = JSON.parse(JSON.stringify(DefaultServerMember));
            serverMemberData._id = `${this.user.id}-${this.guild.id}`;
            serverMemberData.memberID = this._id;
            serverMemberData.guildID = this.guild.id;
            serverMemberData.firstJoin = this.member?.joinedTimestamp??null;
            if (!memberData.servers.includes(this.guild.id)) memberData.servers.push(this.guild.id);
        }

        // Update Member Data
        memberData.username = this.user.username;
        memberData.discriminator = this.user.discriminator;
        memberData.avatarURL = this.user.avatarURL();

        // Update Server Member Data
        if (this.member != null) {
            serverMemberData.displayName = this.member.displayName;
            serverMemberData.nickname = this.member.nickname;
            serverMemberData.roles = this.member.roles.cache.map((role) => role.id);
        }

        for (let i in serverMemberData) this[i] = serverMemberData[i];
        for (let i in memberData) this[i] = memberData[i];
        
        //Update Cached Data
        if (this.server.members[this._id] === undefined) this.server.members[this._id] = {
            username: "",
            nickname: "",
            displayName: "",
            id: this._id,
            trust: 0,
            punishmentCount: 0
        }

        this.server.members[this._id].username = this.username
        this.server.members[this._id].nickname = this.nickname
        this.server.members[this._id].displayName = this.displayName
        this.server.members[this._id].discriminator = this.discriminator
        this.server.members[this._id].activePunishmentCount = this.moderation.history.filter(punishment => {
            return Date.now() - punishment.expires > 0 || punishment.expires == -1
        }).length

        return this;
    }

    addHistory(history: HistoryEntry): void {
        this.moderation.history.push(history);
        this.save();
    }

    async timeout(duration: number, reason: string): Promise<GuildMember> {
        if (duration == -1) {
            new ScheduledEvent({
                time: Date.now() + (2419200000 / 2),
                action: 'RefreshTimeout',
                data: {
                    expires: -1,
                    member: this._id,
                    guild: this.server._id
                } as RefreshTimeoutData
            } as ScheduledEventOptions)

            duration = 2419200000
        } else if (duration > 2419200000) {
            new ScheduledEvent({
                time: Date.now() + (duration / 2),
                action: 'RefreshTimeout',
                data: {
                    expires: Date.now() + duration,
                    member: this._id,
                    guild: this.server._id
                } as RefreshTimeoutData
            } as ScheduledEventOptions)

            duration = 2419200000
        }

        return this.member.disableCommunicationUntil(Date.now() + duration, reason);
    }

    getTrust(): number {
        let trust = this.trustOffset??0;

        if (this.joinGroup != null) {
            let joinGroup = this.server.joinGroups.groups[this.joinGroup]
            trust += joinGroup?.trustOffset??0
        }

        let averageTimeBetweenPunishments;

        const idealTimeBetweenPunishments = 2635200000000;
        const idealMessageCount = 1000;
        const fullJoinTrustTime = 2635200000;

        const guildMember = this.member as GuildMember;
        const user = this.user as User;
        const messageCount = this.messageCount ?? 0;
        const history = this.moderation.history;
        const fullAgeTrustTime = 2635200000;
        const agePercent = clamp((Date.now() - user.createdTimestamp) / fullAgeTrustTime, 0, 1);
        const messagePercent = clamp(messageCount / idealMessageCount, 0, 1);
        const joinPercent = clamp((Date.now() - (this?.firstJoin ?? guildMember?.joinedTimestamp ?? Date.now())) / fullJoinTrustTime, 0, 1);

        trust += agePercent * 20;
        trust += joinPercent * 20;
        trust += messagePercent * 50;

        if (history.length == 0)
            averageTimeBetweenPunishments = idealTimeBetweenPunishments;
        else
            averageTimeBetweenPunishments =
                guildMember?.joinedTimestamp ?? Date.now() / history.length;
        let timeBetweenPunishmentsPercent =
            averageTimeBetweenPunishments / idealTimeBetweenPunishments;
        if (timeBetweenPunishmentsPercent > 1) timeBetweenPunishmentsPercent = 1;

        trust += timeBetweenPunishmentsPercent * 50;

        history.forEach((historyEntry) => {
            let change = 0;
            if (historyEntry.type == "Warning") change = 5;
            else if (historyEntry.type == "Mute") change = 10;
            else if (historyEntry.type == "Kick") change = 15;
            else if (historyEntry.type == "SoftBan") change = 15;
            else if (historyEntry.type == "Quarantine") change = 20;
            else if (historyEntry.type == "Ban") change = 25;

            if (historyEntry.expires > Date.now() || historyEntry.expires == -1)
                change *= 2;
            if (
                historyEntry.expires < Date.now() - 15768000000 &&
                historyEntry.expires != -1
            )
                change = 0;
            trust -= change;
        });

        let badgeTrust = 0
        if (user.flags.has("PARTNERED_SERVER_OWNER")) badgeTrust += 125;
        if (user.flags.has("DISCORD_CERTIFIED_MODERATOR")) badgeTrust += 100;

        if (user.flags.has("BUGHUNTER_LEVEL_1")) badgeTrust += 25;
        if (user.flags.has("BUGHUNTER_LEVEL_2")) badgeTrust += 50;

        if (user.flags.has("EARLY_VERIFIED_BOT_DEVELOPER")) badgeTrust += 25;

        if (user.flags.has("HYPESQUAD_EVENTS")) badgeTrust += 25;
        if (
            user.flags.has("HOUSE_BRILLIANCE") ||
            user.flags.has("HOUSE_BALANCE") ||
            user.flags.has("HOUSE_BRAVERY")
        )
        badgeTrust += 25;

        if (user.flags.has("DISCORD_EMPLOYEE")) badgeTrust += 999;
        if (user.id == Bot.user.id) badgeTrust += 999;

        trust += badgeTrust;

        if (this.isCompromised) trust -= 80;
        if (this.isRaider) trust -= 50;
        if (this.reportBlacklisted) trust -= 15;

        const joinGroup = this.server.joinGroups.groups?.[this.joinGroup]
        if (joinGroup) trust -= joinGroup.users.length * 2;

        let joinGroupUsers = joinGroup?.users??[]
        let totalJoinGroupPunishments = 0
        joinGroupUsers.forEach(id => {
            if (id == this._id) return;
            let user = this.server.members[id]
            totalJoinGroupPunishments += user.activePunishmentCount
        })

        if (totalJoinGroupPunishments > 11) trust -= 25
        else if (totalJoinGroupPunishments > 9) trust -= 20
        else if (totalJoinGroupPunishments > 7) trust -= 15
        else if (totalJoinGroupPunishments > 5) trust -= 10
        else if (totalJoinGroupPunishments > 3) trust -= 5

        trust -= 100;
        if (trust > 100) trust = 100;

        trust = Math.floor(trust * 1000) / 1000;

        this.server.members[this._id].trust = trust;
        return trust;
    }

    getTrustBreakdown(): TrustBreakdown {
        let trust = this.trustOffset??0;
        let trustBreakdown = {
            base: trust,
            age: 0,
            join: 0,
            message: 0,
            timeBetweenPunishments: 0,
            punishments: 0,
            badges: 0,
            joinGroupSize: 0,
            joinGroupPunishments: 0,
            compromised: 0,
            raider: 0,
            reportBlacklisted: 0
        }

        if (this.joinGroup != null) {
            let joinGroup = this.server.joinGroups.groups[this.joinGroup]
            trust += joinGroup?.trustOffset??0
        }

        let averageTimeBetweenPunishments;

        const idealTimeBetweenPunishments = 2635200000000;
        const idealMessageCount = 1000;
        const fullJoinTrustTime = 2635200000;

        const guildMember = this.member as GuildMember;
        const user = this.user as User;
        const messageCount = this.messageCount ?? 0;
        const history = this.moderation.history;
        const fullAgeTrustTime = 2635200000;
        const agePercent = clamp((Date.now() - user.createdTimestamp) / fullAgeTrustTime, 0, 1);
        const messagePercent = clamp(messageCount / idealMessageCount, 0, 1);
        const joinPercent = clamp((Date.now() - (this?.firstJoin ?? guildMember?.joinedTimestamp ?? Date.now())) / fullJoinTrustTime, 0, 1);

        trust += agePercent * 20;
        trust += joinPercent * 20;
        trust += messagePercent * 50;
        
        trustBreakdown.age = agePercent * 20;
        trustBreakdown.join = joinPercent * 20;
        trustBreakdown.message = messagePercent * 50;

        if (history.length == 0)
            averageTimeBetweenPunishments = idealTimeBetweenPunishments;
        else
            averageTimeBetweenPunishments =
                guildMember?.joinedTimestamp ?? Date.now() / history.length;
        let timeBetweenPunishmentsPercent =
            averageTimeBetweenPunishments / idealTimeBetweenPunishments;
        if (timeBetweenPunishmentsPercent > 1) timeBetweenPunishmentsPercent = 1;

        trust += timeBetweenPunishmentsPercent * 50;
        trustBreakdown.timeBetweenPunishments = timeBetweenPunishmentsPercent * 50;
        history.forEach((historyEntry) => {
            let change = 0;
            if (historyEntry.type == "Warning") change = 5;
            else if (historyEntry.type == "Mute") change = 10;
            else if (historyEntry.type == "Kick") change = 15;
            else if (historyEntry.type == "SoftBan") change = 15;
            else if (historyEntry.type == "Quarantine") change = 20;
            else if (historyEntry.type == "Ban") change = 25;

            if (historyEntry.expires > Date.now() || historyEntry.expires == -1)
                change *= 2;
            if (
                historyEntry.expires < Date.now() - 15768000000 &&
                historyEntry.expires != -1
            )
                change = 0;
            trust -= change;
            trustBreakdown.punishments -= change;
        });

        let badgeTrust = 0
        if (user.flags.has("PARTNERED_SERVER_OWNER")) badgeTrust += 125;
        if (user.flags.has("DISCORD_CERTIFIED_MODERATOR")) badgeTrust += 100;

        if (user.flags.has("BUGHUNTER_LEVEL_1")) badgeTrust += 25;
        if (user.flags.has("BUGHUNTER_LEVEL_2")) badgeTrust += 50;

        if (user.flags.has("EARLY_VERIFIED_BOT_DEVELOPER")) badgeTrust += 25;

        if (user.flags.has("HYPESQUAD_EVENTS")) badgeTrust += 25;
        if (
            user.flags.has("HOUSE_BRILLIANCE") ||
            user.flags.has("HOUSE_BALANCE") ||
            user.flags.has("HOUSE_BRAVERY")
        )
        badgeTrust += 25;

        if (user.flags.has("DISCORD_EMPLOYEE")) badgeTrust += 999;
        if (user.id == Bot.user.id) badgeTrust += 999;

        trust += badgeTrust;
        trustBreakdown.badges = badgeTrust;

        if (this.isCompromised) trust -= 80;
        if (this.isRaider) trust -= 50;
        if (this.reportBlacklisted) trust -= 15;
        
        if (this.isCompromised) trustBreakdown.compromised -= 80;
        if (this.isRaider) trustBreakdown.raider -= 50;
        if (this.reportBlacklisted) trustBreakdown.reportBlacklisted -= 15;

        const joinGroup = this.server.joinGroups.groups?.[this.joinGroup]
        if (joinGroup) trust -= joinGroup.users.length * 2;
        if (joinGroup) trustBreakdown.joinGroupSize -= joinGroup.users.length * 2;

        let joinGroupUsers = joinGroup?.users??[]
        let totalJoinGroupPunishments = 0
        joinGroupUsers.forEach(id => {
            if (id == this._id) return;
            let user = this.server.members[id]
            totalJoinGroupPunishments += user.activePunishmentCount
        })

        if (totalJoinGroupPunishments > 11) trust -= 25
        else if (totalJoinGroupPunishments > 9) trust -= 20
        else if (totalJoinGroupPunishments > 7) trust -= 15
        else if (totalJoinGroupPunishments > 5) trust -= 10
        else if (totalJoinGroupPunishments > 3) trust -= 5

        if (totalJoinGroupPunishments > 11) trustBreakdown.joinGroupPunishments -= 25
        else if (totalJoinGroupPunishments > 9) trustBreakdown.joinGroupPunishments -= 20
        else if (totalJoinGroupPunishments > 7) trustBreakdown.joinGroupPunishments -= 15
        else if (totalJoinGroupPunishments > 5) trustBreakdown.joinGroupPunishments -= 10
        else if (totalJoinGroupPunishments > 3) trustBreakdown.joinGroupPunishments -= 5

        trust -= 100;
        if (trust > 100) trust = 100;

        trust = Math.floor(trust * 1000) / 1000;

        this.server.members[this._id].trust = trust;
        return trustBreakdown;
    }

    canRunCommand(command: string): boolean {
        switch (command) {
            case "warn": {
                if (this.member.permissions.has('MODERATE_MEMBERS', true)) return true;
                return false;
            };

            case "mute": {
                if (this.member.permissions.has('MODERATE_MEMBERS', true)) return true;
                return false;
            };

            case "unmute": {
                if (this.member.permissions.has('MODERATE_MEMBERS', true)) return true;
                return false;
            };

            case "quarantine": {
                if (this.member.permissions.has('MANAGE_GUILD', true)) return true;
                return false;
            };

            case "unquarantine": {
                if (this.member.permissions.has('MANAGE_GUILD', true)) return true;
                return false;
            };

            case "kick": {
                if (this.member.permissions.has('KICK_MEMBERS', true)) return true;
                return false;
            };

            case "softban": {
                if (this.member.permissions.has('KICK_MEMBERS', true)) return true;
                return false;
            };

            case "ban": {
                if (this.member.permissions.has('BAN_MEMBERS', true)) return true;
                return false;
            };
            
            case "unban": {
                if (this.member.permissions.has('BAN_MEMBERS', true)) return true;
                return false;
            };

            case 'history': {
                if (this.member.permissions.has('MODERATE_MEMBERS', true)) return true;
                return false;
            }

            case 'notes': {
                if (this.member.permissions.has('MODERATE_MEMBERS', true)) return true;
                return false;
            }

            case 'modinfo': {
                if (this.member.permissions.has('MODERATE_MEMBERS', true)) return true;
                return false;
            }

            case 'reportlink':
            case 'reportraider':
            case 'reportcompromised': {
                return !this.reportBlacklisted;
            };

            case 'reportblackliststatus':
            case 'setraiderstatus':
            case 'setcompromisedstatus': {
                if (this._id == '213396745231532032') return true;
                else return false;
            };

            case 'botinfo': {
                return true;
            };

            default: {
                return false;
            }
        }
    }

    save(): void {
        this.server.members[this._id].username = this.username
        this.server.members[this._id].nickname = this.nickname
        this.server.members[this._id].displayName = this.displayName
        this.server.members[this._id].discriminator = this.discriminator
        this.server.members[this._id].activePunishmentCount = this.moderation.history.filter(punishment => {
            return Date.now() - punishment.expires > 0 || punishment.expires == -1
        }).length

        let memberData: MemberData = {
            _id: this._id,
            username: this.username,
            discriminator: this.discriminator,
            avatarURL: this.avatarURL,
            servers: this.servers,
            isCompromised: this.isCompromised,
            isRaider: this.isRaider,
            serviceBlacklisted: this.serviceBlacklisted,
            trustRating: this.trustRating
        };

        let serverMemberData: ServerMemberData = {
            _id: `${this._id}-${this.guild.id}`,
            memberID: this.member.id,
            guildID: this.guild.id,
            
            displayName: this.displayName,
            nickname: this.nickname,
            firstJoin: this.firstJoin,
            messageCount: this.messageCount,

            antiSpam: this.antiSpam,
            actionStages: this.actionStages,
            activeThreads: this.activeThreads,
            inactiveThreads: this.inactiveThreads,
            moderation: this.moderation,
            roles: this.roles,
            recentMessages: this.recentMessages,
            joinGroup: this.joinGroup
        };

        db.update("Members", memberData._id ,memberData);
        db.update("ServerMembers", serverMemberData._id, serverMemberData);
    }
}

function clamp(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

interface TrustBreakdown {
    base: number,
    age: number,
    join: number,
    message: number,
    timeBetweenPunishments: number,
    punishments: number,
    badges: number,
    joinGroupSize: number,
    joinGroupPunishments: number,
    compromised: number,
    raider: number,
    reportBlacklisted: number
}