export interface DeleteActionOptions {
    timeframe: number;
    count: number;
}

export interface PunishmentAction {
    sendMessage: string;
    sendDM: string;
    deleteMessages: DeleteActionOptions;
    warn: number;
    mute: number;
    quarantine: number;
    ban: number;
    kick: boolean;
    softBan: boolean;
}

interface ActionResult {
    succeded: boolean;
    message: string;
}

export interface ActionResults {
    sendMessage: ActionResult;
    sendDM: ActionResult;
    deleteMessages: ActionResult;
    warn: ActionResult;
    mute: ActionResult;
    quarantine: ActionResult;
    ban: ActionResult;
    kick: ActionResult;
    softBan: ActionResult;
}