export interface ScheduledEventOptions {
    time: number;
    action: 'RefreshTimeout' | 'UnBan' | 'UnlockChannel' | 'UnQuarantine';
    data: RefreshTimeoutData | UnQuarantineData | UnBanData;
}

interface EventData {
    guild: string;
    member: string;
}

export interface ScheduledEventData {
    id: string;
    time: number;
    action: 'RefreshTimeout' | 'UnBan' | 'UnlockChannel' | 'UnQuarantine';
    data: RefreshTimeoutData | UnQuarantineData | UnBanData;
}

export interface UnQuarantineData extends EventData {}

export interface UnBanData extends EventData {}

export interface RefreshTimeoutData extends EventData {
    expires: number;
}