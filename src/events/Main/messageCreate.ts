import { Event } from '../../structures/Event';

import { Server } from '../../structures/Server';
import { Channel } from '../../structures/Channel';
import { Member } from '../../structures/Member';
import { Thread } from '../../structures/Thread';
import { GuildTextBasedChannel, Message, TextChannel, ThreadChannel } from 'discord.js';
import { DetectionsData } from '../../typings/Server';
import { RecentMessageData } from '../../typings/Member';
import { Punishment } from '../../structures/Punishment';

import dice from 'fast-dice-coefficient';
import { computeScores as getZalgoRating } from 'unzalgo';
import { findLinks } from 'links-finder';
import urlParse from 'url-parse'
import { sha256 } from 'js-sha256';
import { Embed } from '../../structures/Embed';
import { Bot, PunishmentQueue, MaliciousLinks } from '../../run'

import fs from 'fs';
const builtInEmojis = fs.readFileSync('./src/builtInEmojis.txt', 'utf-8').split('\n');

export default new Event('messageCreate', async message => {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (message.channel.id == '833088844399247391') return;

    let server = await (new Server(message.guild)).init();
    let channel = await (new Channel(server, message.channel as GuildTextBasedChannel)).init();
    let member = await (new Member(server, message.author.id)).init();
    let thread: Thread;
    if (message.channel.isThread()) thread = await (new Thread(channel, message.channel)).init();
    else thread = null;

    member.messageCount += 1;

    // =================================== \\
    // =========== Debug Stuff =========== \\
    // =================================== \\

    if (message.content == `<@${server.guild.me.id}>` || message.content == `<@!${server.guild.me.id}>`) {
        let debugEmbed = new Embed()
        debugEmbed.setTitle("Debug Info")
        debugEmbed.setDescription(`Im Alive!`)
        debugEmbed.setColor("#00FF00")
        debugEmbed.addField(`API Ping:`, Bot.ws.ping + "ms", true)
        debugEmbed.addField(`Response Time:`, "<a:typing:717121066358800414>", true)
        message.channel.send({ embeds: [debugEmbed.embed] }).then(msg => {
            debugEmbed.embed.fields[1].value = msg.createdTimestamp - message.createdTimestamp + "ms"
            msg.edit({ embeds: [debugEmbed.embed] })
        });
    }

    // =================================== \\
    // ======== Dynamic Slowmode ========= \\
    // =================================== \\

    let slowModeChannel: Thread | Channel;
    if (thread) slowModeChannel = thread;
    else slowModeChannel = channel;

    const dynamicSlowmode = slowModeChannel.dynamicSlowmode;

    if (dynamicSlowmode.enabled) {
        let lastCheck = 0;
        let { currentMessageRate, targetMessageCount, targetMessageTime } = slowModeChannel.dynamicSlowmode;
        currentMessageRate.push(message.createdTimestamp);

        if (Date.now() - lastCheck > 500) {
            currentMessageRate = currentMessageRate.filter(time => Date.now() - time < targetMessageTime)
            let currentSlowmode = (slowModeChannel.channel as ThreadChannel | TextChannel).rateLimitPerUser;
            if (currentMessageRate.length > targetMessageCount + 2) {
                (slowModeChannel.channel as ThreadChannel | TextChannel).setRateLimitPerUser(currentSlowmode + 1);
            } else if (currentMessageRate.length < 2 || currentMessageRate.length < targetMessageCount - 2) {
                (slowModeChannel.channel as ThreadChannel | TextChannel).setRateLimitPerUser(currentSlowmode - 1);
            }

            slowModeChannel.dynamicSlowmode.lastUpdate = Date.now();
        }

        slowModeChannel.dynamicSlowmode.currentMessageRate = currentMessageRate;
    }

    // =================================== \\
    // ========= Save Everything ========= \\
    // =================================== \\

    member.save();
    server.save();
    channel.save();
    if (thread != null) thread.save();

    if (message.member.permissions.has("ADMINISTRATOR")
        && message.guild.id != "775794137877577789") return;
    // Nothing below this point is run if user is an admin, unless it's the dev server.
    // Eventually this will be changed to use some sort of custom permissions system.

    // =================================== \\
    // ============= Anti Spam =========== \\
    // =================================== \\

    // ============================ \\
    // ======== Variables ======== \\
    // ============================ \\

    const detections: DetectionsData = thread?._id ? thread.getDetections() : channel.getDetections();
    let pressures = member.antiSpam.pressures;
    let recentMessages: Array<RecentMessageData> = member.recentMessages;

    // ============================ \\
    // =========== Decay ========== \\
    // ============================ \\

    const lastMessage = recentMessages[recentMessages.length - 1];
    if (lastMessage) {
        const timeSinceLastMessage = message.createdTimestamp - lastMessage.timestamp;
        for (let pressure in detections) {
            pressures[pressure] -= detections[pressure].decay * (timeSinceLastMessage / 1000);
            if (isNaN(pressures[pressure]) || pressures[pressure] < 0) pressures[pressure] = 0;
        }
    }

    // ============================ \\
    // ====== Recent Messages ===== \\
    // ============================ \\

    recentMessages = recentMessages.filter((msg: RecentMessageData) => {
        return Date.now() - msg.timestamp < 7200000
    });
    recentMessages.push({
        id: message.id,
        content: message.content,
        timestamp: message.createdTimestamp
    });
    member.recentMessages = recentMessages;

    // ============================ \\
    // === Pressure Calculation === \\
    // ============================ \\

    const messagePressures = await calculatePressure(message, member, server, detections) as MessagePressures;

    // Apply Pressures
    for (let pressure in messagePressures) {
        let trust = member.getTrust()

        if (trust < -50) messagePressures[pressure] *= 1.3
        else if (trust < -40) messagePressures[pressure] *= 1.25
        else if (trust < -30) messagePressures[pressure] *= 1.2
        else if (trust < -20) messagePressures[pressure] *= 1.1
        else if (trust > 20) messagePressures[pressure] *= .75

        if (messagePressures[pressure] < 0) messagePressures[pressure] = 0;
        if (isNaN(pressures[pressure])) pressures[pressure] = 0;
        pressures[pressure] += messagePressures[pressure];
    }

    // ============================ \\
    // ======== Punishments ======= \\
    // ============================ \\

    let actionStages = member.actionStages;

    // Decreament Stages
    for (let i in actionStages) {
        let actionStage = actionStages[i];
        let decreaseAmount = Math.floor((Date.now() - actionStages[i].time) / 300000);
        if (decreaseAmount > 0) {
            actionStage.stage -= decreaseAmount;
            actionStage.time = Date.now();
            if (actionStage.stage < 0) actionStage.stage = 0;
        }
        actionStages[i] = actionStage;
    }

    // Check for any pressures that will be triggered and remove them from the total.
    for (let pressure in pressures) {
        if (pressures[pressure] >= detections[pressure].threshold) pressures.total -= pressures[pressure];
    }

    for (let pressure in pressures) {
        if (pressures[pressure] < detections[pressure].threshold) continue;
        if (!detections[pressure].enabled) continue;

        let actionGroup = server.actionGroups[detections[pressure].actionGroup];
        let actionStage = actionStages[detections[pressure].actionGroup];
        if (actionGroup == undefined) { console.error('Unknown action group!'); continue; }
        if (actionStage == undefined) actionStage = { stage: 0, time: Date.now() };
        if (actionStage.stage == NaN) actionStage.stage = 0;

        let stageIncrease = Math.floor(pressures[pressure] / detections[pressure].threshold);
        if (stageIncrease <= 0) continue;

        let canSkip = actionGroup?.[actionStage.stage + 1]?.canSkip ?? false;
        if (canSkip) {
            actionStage.stage += stageIncrease;
            pressures[pressure] -= stageIncrease * detections[pressure].threshold;
        } else {
            actionStage.stage += 1;
            pressures[pressure] -= detections[pressure].threshold;
        }

        actionStage.time = Date.now();

        let punishmentStage = actionStage.stage - 1
        if (punishmentStage >= actionGroup.length) punishmentStage = actionGroup.length - 1;

        let stageActions = actionGroup[punishmentStage];
        if (stageActions == undefined) { console.error('Unknown action stage!'); continue; }

        let botMember = await (new Member(server, server.guild.me.id)).init();
        let punishment = new Punishment(botMember, member, server, stageActions.actions, stageActions.reason);
        PunishmentQueue.push({ punishment, channel });
        member.messageCount -= 15;
        actionStages[detections[pressure].actionGroup] = actionStage;
    }

    member.actionStages = actionStages;
    member.antiSpam.pressures = pressures;

    // ============================ \\
    // ========= Anti Scam ======== \\
    // ============================ \\

    if (isScam(message, member)) {
        let botMember = await (new Member(server, server.guild.me.id)).init();
        let punishment = new Punishment(
            botMember,
            member,
            server,
            {
                "sendMessage": "{@Member} has been quarantined for sending a malicious link.",
                "sendDM": "You have been quarantined for sending a malicious link in {Server}. Please recover your account and DM a staff member to be unquarantined.",
                "deleteMessages": {
                    "timeframe": 30000,
                    "count": null
                },
                "warn": null,
                "mute": null,
                "quarantine": -1,
                "kick": null,
                "softBan": null,
                "ban": null
            }, "Malicious Link");
        await punishment.run(channel);
    }

    // =================================== \\
    // ======== Save Everything 2 ======== \\
    // ======== Electric Boogaloo ======== \\
    // =================================== \\

    member.save();
    server.save();
    channel.save();
    if (thread != null) thread.save();
});

function isUpperCase(string: string): Boolean { return /^[A-Z]*$/.test(string) };

function clone(obj: Object | Array<any>): Object | Array<any> {
    return JSON.parse(JSON.stringify(obj));
}

export async function calculatePressure(message: Message, member: Member, server: Server, detections: DetectionsData): Promise<MessagePressures> {
    let pressures: MessagePressures = {} as MessagePressures;

    // Base Pressure
    pressures.message = detections.message.pressure;

    // Length Pressure
    pressures.length = detections.length.pressure * message.content.length;

    // Repeat
    let recentMessages = clone(member.recentMessages) as Array<RecentMessageData>;
    recentMessages.reverse();

    let repeatCount = -1;

    for (let i = 0;
        i < recentMessages.length &&
        repeatCount < server.antiSpam.detections.repeat.maxMultiplier &&
        i < 10; i++) {
        let msg = recentMessages[i];
        if (message.content == undefined || msg.content == undefined) continue;
        if (dice(message.content, msg.content) > 0.75) repeatCount++;
    }

    if (repeatCount >= server.antiSpam.detections.repeat.maxMultiplier)
        repeatCount = server.antiSpam.detections.repeat.maxMultiplier;
    pressures.repeat = repeatCount * detections.repeat.pressure;

    // New Line Pressure
    pressures.newline = (message.content.split("\n").length - 1) * detections.newline.pressure;

    // Wall of Text
    const brailText = '	⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿'.split('')
    let wallOfTextPressure = 0
    brailText.forEach(brailCharacter => {
        let count = occurrences(message.content, brailCharacter, false)
        wallOfTextPressure += .01 * count
    })
    pressures.walloftext = wallOfTextPressure

    // TODO: Write more stuff for this.

    // Inactive
    // TODO: Figure out new way to do inactive detection.

    // Spoilers
    pressures.spoiler = Math.floor(message.content.split("||").length / 2) * detections.spoiler.pressure;

    // Emojis
    let messageEmojis = (message.content.match(/<:.+?:\d+>/g) ?? []).length;
    builtInEmojis.forEach(emoji => {
        let count = occurrences(message.content, emoji, false)
        messageEmojis += count
    })
    pressures.emoji = messageEmojis * detections.emoji.pressure;

    // Stickers
    pressures.sticker = message.stickers.size * detections.sticker.pressure;

    // Short
    if (message.content.length < 4 && message.content.length != 0)
        pressures.short = detections.short.pressure;
    else pressures.short = 0;

    // Caps
    if (message.content.length > 4) {
        let capsPercent =
            message.content.split("").reduce((total: number, current: string) => {
                return total + 1 * Number(isUpperCase(current));
            }, 0) / message.content.length;
        pressures.caps = capsPercent * detections.caps.pressure;
    } else pressures.caps = 0;

    // Zalgo
    let averageZalgo = getZalgoRating(message.content).reduce(
        (total, current) => {
            return (total + current) / 2;
        },
        0
    );
    pressures.zalgo = averageZalgo * detections.zalgo.pressure;

    // ===== Mentions ===== \\

    // User Mentions
    pressures.mentionUser = message.mentions.users.size * detections.mentionUser.pressure;

    // Role Mentions
    pressures.mentionRole = message.mentions.roles.size * detections.mentionRole.pressure;

    // Everyone Mention
    pressures.mentionEveryone = message.mentions.everyone ? 1 : 0 * detections.mentionEveryone.pressure;
    //==========

    // ===== Attachements ===== \\

    // Embeds
    pressures.embed = message.embeds.length * detections.embed.pressure;

    // Files & Images
    pressures.file = 0;
    pressures.image = 0;

    message.attachments.forEach((attachement) => {
        if (attachement.height) pressures.image += detections.image.pressure;
        else pressures.file += detections.file.pressure;
    });
    //==========

    // ===== Links ===== \\
    let linkPositions = findLinks(message.content);
    let links = [];
    linkPositions.forEach((linkPosition) => {
        links.push(
            message.content
                .substring(linkPosition.start, linkPosition.end + 1)
                .toLowerCase()
        );
    });

    // Get Invites
    let customURL = server.guild.vanityURLCode ?? "";
    let invites = await server.guild.invites.fetch();

    pressures.invite = 0;
    pressures.nsfw = 0;
    pressures.link = 0;

    links.forEach(async (link) => {
        let isInvite =
            (link.indexOf("discord.com") != -1 || link.indexOf("discord.gg") != -1) &&
            link.indexOf("channels") == -1;

        // Invites
        if (isInvite) {
            let isValid = false;
            let code = link.split("/").pop();
            if (code === customURL) isValid = true;
            else isValid = invites.find((invite) => invite.code === code) != null;

            if (!isValid) pressures.invite += detections.invite.pressure;
        } else {
            // NSFW
            // TODO: Setup NSFW detection

            // Other
            pressures.link += detections.link.pressure;
        }
    });

    if (message.channel.id == '831964039566983178') pressures.invite = 0
    //==========

    // Make sure nothing is NaN
    pressures.total = 0;
    for (let pressure in pressures) {
        if (pressure == "total") continue;
        if (isNaN(pressures[pressure])) pressures[pressure] = 0;
        pressures.total += pressures[pressure];
    }

    return pressures;
}

export function isScam(message: Message, member: Member) {
    // The Good Part
    let scamChance: number = 0;
    const trust: number = member.getTrust();
    const content: string = message.content.toLowerCase();

    const linkPositions = findLinks(content);
    let links = [];
    linkPositions.forEach((linkPosition) => {
        links.push(
            content
                .substring(linkPosition.start, linkPosition.end + 1)
                .toLowerCase()
        );
    });

    let containsBadLink = false
    links.forEach(link => {
        const urlInfo = urlParse(link);

        let domain = ""
        if (urlInfo.protocol != "") domain = urlInfo.host
        else domain = urlInfo.pathname.split('/')[0]

        const hash = sha256(domain);
        if (MaliciousLinks.indexOf(hash) != -1) containsBadLink = true;
    })
    if (containsBadLink) return true;

    // The Worse Part

    const lowChanceWords = [
        "cs go",
        "cs:go",
        "giveaway",
        "skin",
        "steam",
        "take",
        "faster",
        "generator"
    ]
    const medChanceWords = [
        "nitro",
        "discord",
        "airdrop",
        "free",
        "left over",
        "password",
        "test",
        "first",
        "game"
    ]
    const highChanceWords = [
        "@everyone"
    ]

    lowChanceWords.forEach(word => { if (content.includes(word)) scamChance += 10; });
    medChanceWords.forEach(word => { if (content.includes(word)) scamChance += 20; });
    highChanceWords.forEach(word => { if (content.includes(word)) scamChance += 40; });

    if (links.length == 1) scamChance += 20;

    if (content === "https://tenor.com/view/discord-discord-nitro-nitro-free-nitro-free-discord-nitro-gif") scamChance = 0;
    if (scamChance >= 95) return true;

    return false
}

export interface MessagePressures {
    total: number;
    message: number;
    length: number;
    repeat: number;
    invite: number;
    nsfw: number;
    emoji: number;
    sticker: number;
    newline: number;
    inactive: number;
    mentionUser: number;
    mentionRole: number;
    mentionEveryone: number;
    embed: number;
    file: number;
    image: number;
    link: number;
    short: number;
    spoiler: number;
    walloftext: number;
    caps: number;
    zalgo: number;
}

export function occurrences(string: string, subString: string, allowOverlapping: boolean): number {
    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}