import { Event } from '../../structures/Event';

import { Server } from '../../structures/Server';
import { Channel } from '../../structures/Channel';
import { Member } from '../../structures/Member';
import { Thread } from '../../structures/Thread';
import { GuildTextBasedChannel, Message } from 'discord.js';
import { DetectionsData } from '../../typings/Server';
import { Punishment } from '../../structures/Punishment';

import { isScam, calculatePressure, MessagePressures, occurrences } from './messageCreate';
import { PunishmentQueue } from '../../run'

import fs from 'fs';

export default new Event('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild) return;
    if (oldMessage.author.bot) return;

    let server = await (new Server(oldMessage.guild)).init();
    let channel = await (new Channel(server, oldMessage.channel as GuildTextBasedChannel)).init();
    let member = await (new Member(server, oldMessage.author.id)).init();
    let thread: Thread;
    if (oldMessage.channel.isThread()) thread = await (new Thread(channel, oldMessage.channel)).init();
    else thread = null;

    if (oldMessage.member.permissions.has("ADMINISTRATOR")
        && oldMessage.guild.id != "775794137877577789") return;
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

    // ============================ \\
    // === Pressure Calculation === \\
    // ============================ \\
    
    const oldMessagePressures = await calculatePressure(oldMessage as Message, member, server, detections) as MessagePressures;
    const newMessagePressures = await calculatePressure(newMessage as Message, member, server, detections) as MessagePressures;
    let trust = member.getTrust()

    // Apply Pressures
    for (let pressure in newMessagePressures) {
        if (oldMessagePressures[pressure] < 0) oldMessagePressures[pressure] = 0;
        if (newMessagePressures[pressure] < 0) newMessagePressures[pressure] = 0;
        if (isNaN(pressures[pressure])) pressures[pressure] = 0;

        if (trust < -50) oldMessagePressures[pressure] = 1.3
        else if (trust < -40) oldMessagePressures[pressure] /= 1.25
        else if (trust < -30) oldMessagePressures[pressure] /= 1.2
        else if (trust < -20) oldMessagePressures[pressure] /= 1.1
        else if (trust > 20) oldMessagePressures[pressure] /= .75

        if (trust < -50) newMessagePressures[pressure] *= 1.3
        else if (trust < -40) newMessagePressures[pressure] *= 1.25
        else if (trust < -30) newMessagePressures[pressure] *= 1.2
        else if (trust < -20) newMessagePressures[pressure] *= 1.1
        else if (trust > 20) newMessagePressures[pressure] *= .75

        pressures[pressure] -= oldMessagePressures[pressure] * 0.9;
        pressures[pressure] += newMessagePressures[pressure];
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

    for (let pressure in pressures){
        if (pressures[pressure] < detections[pressure].threshold) continue;
        if (!detections[pressure].enabled) continue;

        let actionGroup = server.actionGroups[detections[pressure].actionGroup];
        let actionStage = actionStages[detections[pressure].actionGroup];
        if (actionGroup == undefined) { console.error('Unknown action group!'); continue; }
        if (actionStage == undefined) actionStage = { stage: 0, time: Date.now() };
        if (actionStage.stage == NaN) actionStage.stage = 0;

        let stageIncrease = Math.floor(pressures[pressure] / detections[pressure].threshold);

        let canSkip = actionGroup?.[actionStage.stage + 1]?.canSkip ?? false;
        if (canSkip) {
            actionStage.stage += stageIncrease;
            if (stageIncrease <= 0) continue;
            pressures[pressure] -= stageIncrease * detections[pressure].threshold;
        } else {
            actionStage.stage += 1;
            if (stageIncrease <= 0) continue;
            pressures[pressure] -= detections[pressure].threshold;
        }

        actionStage.time = Date.now();

        let punishmentStage = actionStage.stage - 1
        if (punishmentStage >= actionGroup.length) punishmentStage = actionGroup.length - 1;

        let stageActions = actionGroup[punishmentStage];
        if (stageActions == undefined) { console.error('Unknown action stage!'); continue; }

        let botMember = await (new Member(server, server.guild.me.id)).init();
        let punishment = new Punishment(botMember, member, server, stageActions.actions, stageActions.reason);
        //punishment.run(channel);
        PunishmentQueue.push({punishment, channel});
        //server.sendLog('punishment', {embeds: [punishment.getEmbed().embed]}, channel, member);
        actionStages[detections[pressure].actionGroup] = actionStage;
    }

    member.actionStages = actionStages;
    member.antiSpam.pressures = pressures;

    // ============================ \\
    // ========= Anti Scam ======== \\
    // ============================ \\

    if (isScam(newMessage as Message, member)) {
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

function isUpperCase (string: string): Boolean {return /^[A-Z]*$/.test(string)};

function clone(obj: Object | Array<any>): Object | Array<any> {
    return JSON.parse(JSON.stringify(obj));
}