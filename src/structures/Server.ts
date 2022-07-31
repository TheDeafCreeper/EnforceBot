import { Guild } from 'discord.js';
import { db } from '../run';
import { Role, TextBasedChannel, User, GuildMember, MessageOptions, Message } from 'discord.js';
import { 
    AntiSpamData, 
    JoinGateData,
    ModerationData,
    ActionGroups,
    LoggingOptions, 
    JoinGroupData,
    MemberData,
    AntiRaidData} from '../typings/Server';
import { Channel } from './Channel';

const DefaultServer = require('../defaults/Server.json');
const CONFIG = require("../config.json")

export class Server {
    _id: string;
    name: string;
    acronym: string;
    iconURL: string;
    bannerURL: string;
    owner: string;
    antiSpam: AntiSpamData;
    warningThresholds: Object;
    antiGrief: Object;
    antiRaid: AntiRaidData;
    joinGate: JoinGateData;
    moderation: ModerationData;
    actionGroups: ActionGroups;
    channels: Array<string>;
    roles: Array<string>;
    members: Map<string, MemberData>;
    scheduledEvents: Array<object>;
    logging: LoggingOptions;
    joinGroups: JoinGroupData;

    guild: Guild;

    constructor(guild : Guild) {
        this.guild = guild;
        this._id = guild.id;
    }

    async init() : Promise<Server> {
        let server: Server = (await db.read('Servers', this._id)) as Server;
        
        if (!server) {
            server = JSON.parse(JSON.stringify(DefaultServer));
            server._id = this._id;

            db.insert('Servers', server);
        }

        server.name = this.guild.name;
        server.acronym = this.guild.nameAcronym;
        server.iconURL = this.guild.iconURL();
        server.bannerURL = this.guild.bannerURL();
        server.owner = this.guild.ownerId

        for (let i in server) this[i] = server[i];

        if (this._id == '743874180143120408' && this.logging != null) {
            this.logging.enabled = true
            this.logging.channels.default = '750431742396989480'
        }

        return this;
    }

    async fetchQuaratinedRole(): Promise<Role> {
        let role : Role = null;

        if (this.moderation.quarantineRole == null || !(await this.guild.roles.fetch(this.moderation.quarantineRole))) {
            this.guild.roles.cache.forEach((Role) => {
                switch (Role.name.toLowerCase()) {
                    case "quarantined":
                    case "hard mute":
                    case "hardmute":
                        role = Role;
                        break;
                }
            });

            if (role == null) {
                role = await this.guild.roles.create({
                    name: "Quarantined",
                    mentionable: false,
                    permissions: [],
                });
            }

            // TODO: Update channel perms

            this.moderation.quarantineRole = role.id;
            this.save();
        } else {
            role = await this.guild.roles.fetch(this.moderation.quarantineRole);
        }

        return role;
    }

    async sendLog(logEvent: LogEvent, contents: string | MessageOptions, channel: Channel, user: User | GuildMember ): Promise<Message> {
        if (!this.logging.enabled) return null;
        const channels = this.logging.channels;
        let channelID = channels.default;

        if (channel != null && this.logging.ignoredChannels.includes(channel._id)) return null;
        if (user != null && this.logging.ignoredMembers.includes(user.id)) return null;

        const channelGroup = this.logging.eventCategories[logEvent];
        if (channels[channelGroup] != null) channelID = channels[channelGroup];

        if (this._id == CONFIG.devID) channelID = "839421725191438356";
        else if (this.logging.channels.default == null) return null

        if (channelID == null) return null;
        let logChannel = await this.guild.channels.fetch(channelID) as TextBasedChannel;
        if (logChannel == null) return null;
        return logChannel.send(contents)
    }

    isLoggingChannel(channelID: string): boolean {
        const channels = this.logging.channels;
        let isChannel = false
        for (let id in channels) {
            if (channels[id] == channelID) {
                isChannel = true;
                break;
            }
        }

        return isChannel
    }

    save(): void {
        let guild = this.guild
        delete this.guild;

        db.update('Servers', this._id, this);
        this.guild = guild;
    }
}

type LogEvent = (
    'messageUpdate' |
    'messageDelete' |
    'messageDeleteBulk' |
    'messageReactionRemoveAll' |

    'channelCreate' |
    'channelDelete' |
    'channelUpdate' |
    'channelPinsUpdate' |

    'emojiCreate' |
    'emojiDelete' |
    'emojiUpdate' |

    'guildBanAdd' |
    'guildBanRemove' |
    'punishmentExecuted' |

    'guildMemberAdd' |
    'guildMemberRemove' |

    'guildMemberUpdate' |

    'guildUpdate' |

    'inviteCreate' |
    'inviteDelete' |

    'roleCreate' |
    'roleDelete' |
    'roleUpdate' |

    'guildScheduledEventCreate' |
    'guildScheduledEventDelete' |
    'guildScheduledEventUpdate' |

    'stageInstanceCreate' |
    'stageInstanceDelete' |
    'stageInstanceUpdate' |

    'stickerCreate' |
    'stickerDelete' |
    'stickerUpdate' |

    'threadCreate' |
    'threadDelete' |
    'threadUpdate'
)