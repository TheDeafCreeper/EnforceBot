import { Member } from './Member';
import { Server } from './Server';
import { Channel } from './Channel';
import { PunishmentAction, ActionResults } from '../typings/Punishment';
import { HistoryEntry } from '../typings/Member';
import { Embed } from './Embed';
import { GuildTextBasedChannel, MessageEmbed, RoleResolvable, User } from 'discord.js';
import { ScheduledEventOptions, UnQuarantineData, UnBanData } from '../typings/ScheduledEvents';
import { ScheduledEvent } from './ScheduledEvent';
import { AuditEntry } from './AuditEntry';

export class Punishment {
    actor: Member;
    target: Member;
    server: Server;
    actions: PunishmentAction;
    reason: string;
    actionResults: ActionResults;
    isPending: boolean;

    constructor(actor: Member, target: Member, server: Server, actions: PunishmentAction, reason: string) {
        this.actor = actor;
        this.target = target;
        this.server = server;
        this.actions = actions;
        this.reason = reason;
        this.actionResults = {
            sendMessage: { succeded: null, message: null },
            sendDM: { succeded: null, message: null },
            deleteMessages: { succeded: null, message: null },
            warn: { succeded: null, message: null },
            mute: { succeded: null, message: null },
            quarantine: { succeded: null, message: null },
            kick: { succeded: null, message: null },
            softBan: { succeded: null, message: null },
            ban: { succeded: null, message: null }
        }

        this.isPending = true
    };

    async run(tempChannel?: Channel) {
        const channel: GuildTextBasedChannel = tempChannel.channel ?? null;
        if (tempChannel == null) this.actions.sendMessage = null;

        if (this.actions.sendMessage !== null) {
            try {
                let duration = this.actions.mute
                if (this.actions.quarantine && this.actions.quarantine > this.actions.mute) duration = this.actions.quarantine
                if (duration != null) duration += Date.now()
                await channel.send(this.replacePlaceholders(this.actions.sendMessage, duration));
                this.actionResults.sendMessage = { succeded: true, message: null };
            } catch (err) {
                console.error(`Failed to send punishment message: ${err}`);
                this.actionResults.sendMessage = { succeded: false, message: err };
            }
        }

        if (this.actions.sendDM !== null) {
            try {
                let duration = this.actions.mute
                if (this.actions.quarantine && this.actions.quarantine > this.actions.mute) duration = this.actions.quarantine
                if (duration != null) duration += Date.now()
                await (this.target.user as User).send(this.replacePlaceholders(this.actions.sendDM, duration));
                this.actionResults.sendDM = { succeded: true, message: null };
            } catch (err) {
                //logger.error(`Failed to send punishment DM: ${err}`);
                this.actionResults.sendDM = { succeded: false, message: err };
            }
        }

        if (tempChannel !== null && this.actions.deleteMessages !== null) {
            try {
                let messages = await channel.messages.fetch({ limit: 100 });
                let action = this.actions.deleteMessages
                if (action.timeframe) {
                    messages = messages.filter((msg) => {
                        return msg.createdTimestamp > Date.now() - action.timeframe;
                    });
                }
                messages = messages.filter((msg) => {
                    return msg.author.id == this.target._id;
                });
                if (action.count) {
                    let totalCount = -1;
                    messages = messages.filter((msg) => {
                        totalCount++;
                        return totalCount < action.count;
                    });
                }

                const msgs = await channel.bulkDelete(messages, true);
                this.actionResults.deleteMessages = { succeded: true, message: `${msgs.size}` };
            } catch (err) {
                console.error(`Failed to delete messages: ${err}`);
                this.actionResults.deleteMessages = { succeded: false, message: err };
            }
        }

        if (this.actions.warn !== null) {
            try {
                this.target.addHistory({
                    type: 'Warning',
                    actor: this.actor._id,
                    reason: this.reason,
                    expires: Date.now() + this.actions.warn,
                    duration: this.actions.warn,
                    time: Date.now()
                } as HistoryEntry)
                this.actionResults.warn = { succeded: true, message: null };
            } catch (err) {
                console.error(`Failed to warn member: ${err}`);
                this.actionResults.warn = { succeded: false, message: err };
            }
        }

        if (this.actions.mute !== null) {
            try {
                this.target.addHistory({
                    type: 'Mute',
                    actor: this.actor._id,
                    reason: this.reason,
                    expires: Date.now() + this.actions.mute,
                    duration: this.actions.mute,
                    time: Date.now()
                } as HistoryEntry)

                await this.target.timeout(this.actions.mute, this.reason);

                this.actionResults.mute = { succeded: true, message: null };
            } catch (err) {
                console.error(`Failed to mute member: ${err}`);
                this.actionResults.mute = { succeded: false, message: err };
            }
        }

        if (this.actions.quarantine !== null) {
            try {
                this.target.addHistory({
                    type: 'Quarantine',
                    actor: this.actor._id,
                    reason: this.reason,
                    expires: Date.now() + this.actions.quarantine,
                    duration: this.actions.quarantine,
                    time: Date.now()
                } as HistoryEntry)

                await this.target.timeout(this.actions.quarantine, this.reason);

                let removedRoles: Array<RoleResolvable> = [];
                this.target.member.roles.cache.forEach(role => {
                    if (!role.managed) removedRoles.push(role.id);
                })
                this.target.moderation.removedRoles = removedRoles;
                const quarantineRole = await this.server.fetchQuaratinedRole();
                await this.target.member.roles.remove(removedRoles);
                await this.target.member.roles.add(quarantineRole);

                if (this.actions.quarantine != -1) {
                    new ScheduledEvent({
                        time: Date.now() + this.actions.quarantine,
                        action: 'UnQuarantine',
                        data: {
                            member: this.target._id,
                            guild: this.server._id
                        } as UnQuarantineData
                    } as ScheduledEventOptions)
                }

                this.actionResults.quarantine = { succeded: true, message: null };
            } catch (err) {
                console.error(`Failed to quarantine member: ${err}`);
                this.actionResults.quarantine = { succeded: false, message: err };
            }
        }

        if (this.actions.kick !== null) {
            try {
                this.target.addHistory({
                    type: 'Kick',
                    actor: this.actor._id,
                    reason: this.reason,
                    expires: null,
                    duration: null,
                    time: Date.now()
                } as HistoryEntry)

                await this.target.member.kick(this.reason).catch(err => { });

                this.actionResults.kick = { succeded: true, message: null };
            } catch (err) {
                console.error(`Failed to kick member: ${err}`);
                this.actionResults.kick = { succeded: false, message: err };
            }
        }

        if (this.actions.softBan !== null) {
            try {
                this.target.addHistory({
                    type: 'SoftBan',
                    actor: this.actor._id,
                    reason: this.reason,
                    expires: null,
                    duration: null,
                    time: Date.now()
                } as HistoryEntry)

                await this.target.member.ban({ reason: this.reason });
                await this.server.guild.bans.remove(this.target._id);

                this.actionResults.softBan = { succeded: true, message: null };
            } catch (err) {
                console.warn(`Failed to softBan member: ${err}`);
                this.actionResults.softBan = { succeded: false, message: err };
            }
        }

        if (this.actions.ban !== null) {
            try {
                this.target.addHistory({
                    type: 'Ban',
                    actor: this.actor._id,
                    reason: this.reason,
                    expires: Date.now() + this.actions.ban,
                    duration: this.actions.ban,
                    time: Date.now()
                } as HistoryEntry)

                if (this.actions.ban != -1) {
                    new ScheduledEvent({
                        time: Date.now() + this.actions.ban,
                        action: 'UnBan',
                        data: {
                            member: this.target._id,
                            guild: this.server._id
                        } as UnBanData
                    } as ScheduledEventOptions)
                }

                if (this.target.member) await this.target.member.ban({ reason: this.reason })
                else await this.server.guild.bans.create(this.target._id, { reason: this.reason })

                this.actionResults.ban = { succeded: true, message: null };
            } catch (err) {
                console.error(`Failed to ban member: ${err}`);
                this.actionResults.ban = { succeded: false, message: err };
            }
        }

        this.isPending = false;
        this.server.sendLog('punishmentExecuted', { embeds: [this.getEmbed().embed] }, null, null)

        if (this.actionResults.deleteMessages.succeded) new AuditEntry('PurgeMessages', this.actor._id, this.server._id, {
            deleted: this.actionResults.deleteMessages.message,
            count: this.actions.deleteMessages.count,
            timeframe: this.actions.deleteMessages.timeframe,
            target: this.target._id
        })
        if (this.actionResults.warn.succeded) new AuditEntry('Warn', this.actor._id, this.server._id, { duration: this.actions.warn, target: this.target._id })
        if (this.actionResults.mute.succeded) new AuditEntry('Mute', this.actor._id, this.server._id, { duration: this.actions.mute, target: this.target._id })
        if (this.actionResults.quarantine.succeded) new AuditEntry('Quarantine', this.actor._id, this.server._id, { duration: this.actions.quarantine, target: this.target._id })
        if (this.actionResults.kick.succeded) new AuditEntry('Kick', this.actor._id, this.server._id, { target: this.target._id })
        if (this.actionResults.softBan.succeded) new AuditEntry('SoftBan', this.actor._id, this.server._id, { target: this.target._id })
        if (this.actionResults.ban.succeded) new AuditEntry('Ban', this.actor._id, this.server._id, { duration: this.actions.ban, target: this.target._id })
    }

    getEmbed(): Embed {
        let log = new Embed()
        if (this.isPending) log.setTitle(`Punishmnent Pending`);
        else log.setTitle(`Punishmnent Executed`);

        if (this.isPending) log.setColor(0xffff00);
        else log.setColor(0xff0000);

        log.setAuthor(this.target);
        let actions = ""
        if (this.actions.sendMessage !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.sendMessage.succeded === null) actions += `🟨`
            else if (this.actionResults.sendMessage.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | 🎙️"
            if (this.actionResults.sendMessage.succeded === null) actions += ` Message Pending`
            else if (this.actionResults.sendMessage.succeded) actions += ` Message Sent`
            else actions += ` Failed to send message: ${getBetterError(this.actionResults.sendMessage.message)}`
        }
        if (this.actions.sendDM !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.sendDM.succeded === null) actions += `🟨`
            else if (this.actionResults.sendDM.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | ✉️"

            if (this.actionResults.sendDM.succeded === null) actions += ` DM Pending`
            else if (this.actionResults.sendDM.succeded) actions += ` DM Sent`
            else actions += ` Failed to send DM: ${getBetterError(this.actionResults.sendDM.message)}`
        }
        if (this.actions.deleteMessages !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.deleteMessages.succeded === null) actions += `🟨`
            else if (this.actionResults.deleteMessages.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | 🗑️"
            if (this.actionResults.deleteMessages.succeded === null) actions += ` Message Purge Pending`
            else if (this.actionResults.deleteMessages.succeded) actions += ` ${this.actionResults.deleteMessages.message} Message(s) Purged`
            else actions += ` Failed to purge messages: ${getBetterError(this.actionResults.deleteMessages.message)}`
        }
        if (this.actions.warn !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.warn.succeded === null) actions += `🟨`
            else if (this.actionResults.warn.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | ⚠️"
            if (this.actionResults.warn.succeded === null) {
                actions += ` Warn Pending; `
                if (this.actions.warn === -1) actions += `The warning will never expire.`
                else actions += ` The warning will expire <t:${toSec(Date.now() + this.actions.warn)}:R>`
            } else if (this.actionResults.warn.succeded) {
                actions += ` Member Warned; `
                if (this.actions.warn === -1) actions += `The warning will never expire.`
                else actions += ` The warning will expire <t:${toSec(this.actions.warn + Date.now())}:f>`
            }
            else actions += ` Failed to warn member: ${getBetterError(this.actionResults.warn.message)}`
        }
        if (this.actions.mute !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.mute.succeded === null) actions += `🟨`
            else if (this.actionResults.mute.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | 🔇"
            if (this.actionResults.mute.succeded === null) {
                actions += ` Mute Pending; `
                if (this.actions.mute === -1) actions += `The mute will never expire.`
                else actions += ` The mute will expire <t:${toSec(Date.now() + this.actions.mute)}:R>`
            } else if (this.actionResults.mute.succeded) {
                actions += ` Member Muted; `
                if (this.actions.mute === -1) actions += `The mute will never expire.`
                else actions += ` The mute will expire <t:${toSec(this.actions.mute + Date.now())}:f>`
            }
            else actions += ` Failed to mute member: ${getBetterError(this.actionResults.mute.message)}`
        }
        if (this.actions.quarantine !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.quarantine.succeded === null) actions += `🟨`
            else if (this.actionResults.quarantine.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | 🔕"
            if (this.actionResults.quarantine.succeded === null) {
                actions += ` Quarantine Pending; `
                if (this.actions.quarantine === -1) actions += `The quarantine will never expire.`
                else actions += ` The quarantine will expire <t:${toSec(Date.now() + this.actions.quarantine)}:R>`
            } else if (this.actionResults.quarantine.succeded) {
                actions += ` Member Quarantined; ${this.actionResults.quarantine.message} Role(s) Removed; `
                if (this.actions.quarantine === -1) actions += `The quarantine will never expire.`
                else actions += ` The quarantine will expire <t:${toSec(this.actions.quarantine + Date.now())}:f>`
            }
            else actions += ` Failed to quarantine member: ${getBetterError(this.actionResults.quarantine.message)}`
        }
        if (this.actions.kick !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.kick.succeded === null) actions += `🟨`
            else if (this.actionResults.kick.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | 🚷"
            if (this.actionResults.kick.succeded === null) actions += ` Kick Pending`
            else if (this.actionResults.kick.succeded) actions += ` Member Kicked`
            else actions += ` Failed to kick member: ${getBetterError(this.actionResults.kick.message)}`
        }
        if (this.actions.softBan !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.softBan.succeded === null) actions += `🟨`
            else if (this.actionResults.softBan.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | 🔨"
            if (this.actionResults.softBan.succeded === null) actions += ` Kick Pending`
            else if (this.actionResults.softBan.succeded === true) actions += ` Member Softbanned`
            else actions += ` Failed to softBan member: ${getBetterError(this.actionResults.softBan.message)}`
        }
        if (this.actions.ban !== null) {
            if (actions != "") actions += "\n"
            if (this.actionResults.ban.succeded === null) actions += `🟨`
            else if (this.actionResults.ban.succeded) actions += `🟩`
            else actions += `🟥`

            actions += " | ⚒️"
            if (this.actionResults.ban.succeded === null) {
                actions += ` Ban Pending; `
                if (this.actions.ban === -1) actions += `The ban will never expire.`
                else actions += `The ban will expire <t:${toSec(Date.now() + this.actions.ban)}:R>`
            } else if (this.actionResults.ban.succeded) {
                actions += ` Member Banned; `
                if (this.actions.ban === -1) actions += `The ban will never expire.`
                else actions += `The ban will expire <t:${toSec(this.actions.ban + Date.now())}:f>`
            } else actions += ` Failed to ban member: ${getBetterError(this.actionResults.ban.message)}`
        }

        log.setDescription(`${actions}`);
        log.addField("Actor", `<@!${this.actor._id}>`, true);
        log.addField("Reason", this.reason, true);
        return log;
    }

    /*
        ===== PLACEHOLDERS =====
        {Username}
        {Username#discrim}
        {Nickname}
        {Displayname}
        {@Member} - @User
        {Server} - Server name
        {ExpiredString} - never expire/expire time
    */
    replacePlaceholders(string: string, expires?: number): string {

        string = string.split('{Username}').join(`${this.target.username}`)
        string = string.split('{Username#Discrim}').join(`${this.target.username}#${this.target.discriminator}`)
        string = string.split(`{Nickname}`).join(`${this.target.nickname ?? this.target.username}`)
        string = string.split(`{Displayname}`).join(`${this.target.displayName}`)
        string = string.split(`{@Member}`).join(`<@${this.target._id}>`)
        string = string.split(`{Server}`).join(`${this.server.name}`)

        if (expires) {
            if (expires != -1)
                string = string.split(`{ExpiredString}`).join(`expire <t:${toSec(expires)}:f>`)
            else string = string.split(`{ExpiredString}`).join(`never expire`)
        }

        return string;
    }
}

function toSec(num: number): number {
    return Math.floor(num / 1000);
}

function getBetterError(error: string): string {
    //console.log(error.split('\n'))
    //if (error.startsWith('DiscordAPIError: Missing Permissions')) return 'Missing Permissions'

    return error
}