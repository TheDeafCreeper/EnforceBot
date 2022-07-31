import { db } from "../run";

export class AuditEntry {
    guildID: string;
    created: number;
    actor: string;
    type: auditType;

    data: Object;

    constructor(type: auditType, actor: string, guildID: string, data: Object) {
        this.type = type;
        this.actor = actor;
        this.guildID = guildID;
        this.data = data;

        this.created = Date.now();

        db.insert(`AuditLogs`, this)
    }
}

type auditType = (
    'Warn' |
    'Mute' |
    'Quarantine' |
    'Kick' |
    'SoftBan' |
    'Ban' |
    'Lockdown' |
    'UnLockdown' |
    'AddPunishment' |
    'RemovedPunishment' |
    'AddNote' |
    'RemoveNote' |
    'ModifySettings' |
    'ModifyPermissions' |
    'PurgeMessages'
)