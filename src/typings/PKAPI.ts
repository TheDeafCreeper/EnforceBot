interface SystemPrivacyObject {
    description_privacy: boolean | 'public' | 'private';
    member_list_privacy: boolean | 'public' | 'private';
    group_list_privacy: boolean | 'public' | 'private';
    front_privacy: boolean | 'public' | 'private';
    front_history_privacy: boolean | 'public' | 'private';
}

export interface System {
    id: string;
    uuid: string;
    name?: string;
    description?: string;
    tag?: string;
    avatar_url?: string;
    banner?: string;
    created: Date;
    privacy: SystemPrivacyObject;
}

interface MemberPrivacyObject {
    visibility?: boolean | 'public' | 'private';
    name_privacy?: boolean | 'public' | 'private';
    description_privacy?: boolean | 'public' | 'private';
    avatar_privacy?: boolean | 'public' | 'private';
    birthday_privacy?: boolean | 'public' | 'private';
    pronoun_privacy?: boolean | 'public' | 'private';
    metadata_privacy?: boolean | 'public' | 'private';
}

interface Tag {
    prefix?: string;
    suffix?: string;
}

export interface Member {
    id: string;
    uuid: string;
    system: string;
    name: string;
    display_name?: string;
    description?: string;
    pronouns?: string;
    color?: string;
    avatar_url?: string;
    banner?: string;
    birthday?: Date;
    proxy_tags: Tag[],
    keep_proxy: boolean;
    created: Date;
    privacy: MemberPrivacyObject;
}

interface GroupPrivacyObject {
    description_privacy?: boolean | 'public' | 'private';
    icon_privacy?: boolean | 'public' | 'private';
    list_privacy?: boolean | 'public' | 'private';
    visibility?: boolean | 'public' | 'private';
}

export interface Group {
    id: string;
    uuid: string;
    name: string;
    display_name: string;
    description: string;
    icon: string;
    banner: string;
    color: string;
    created: Date;
    privacy: GroupPrivacyObject;
}

export interface Switch {
    id: string;
    timestamp: Date;
    members: Array<string> | Map<string, Member>
}

export interface PKMessage {
    timestamp: Date;
    id: string;
    original: string;
    channel: string;
    sender: string;
    system: System;
    member: Member;
}

export interface SystemGuildSettings {
    guild: string;
    proxying_enabled: boolean;
    autoproxy_mode: 'off' | 'front' | 'latch' | 'member';
    autoproxy_member: string;
    tag: string;
    tag_enabled: boolean;
}

export interface MemberGuildSettings {
    guild: string;
    display_name: string;
    avatar_url: string;
}