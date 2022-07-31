import { ExtendedClient } from "./structures/Client";
import { Database } from "./structures/Database";
import axios from 'axios';
import * as fs from 'fs';
import { sha256 } from 'js-sha256';
import { Cache } from "./structures/Cache";
import { Punishment } from "./structures/Punishment";
import { Channel } from "./structures/Channel";

const CONFIG = require('./config.json')
export const InteractionCache = new Cache(1800000);
const RecentPunishments: Map<string, Array<RecentPunishmentInfo>> = new Map();
export const PunishmentQueue: Array<PunishmentInfo> = [];
export const db = new Database(CONFIG.database, 'EnforcePrototype', null, null)
export const Bot = new ExtendedClient();
export var MaliciousLinks: Array<string> = [];
init();
Bot.start();

async function getBadLinks(): Promise<string[]> {
    if (!fs.existsSync('./localMaliciousLinks.txt')) { fs.writeFileSync('./localMaliciousLinks.txt', ''); }

    let sources = []

    try { sources[0] = (await axios.get('https://cdn.discordapp.com/bad-domains/hashes.json')).data } catch (err) { sources[0] = []; }
    try { sources[1] = (await axios.get('https://raw.githubusercontent.com/BuildBot42/discord-scam-links/main/list.txt')).data } catch (err) { sources[1] = ''; }
    try { sources[2] = (await axios.get('https://raw.githubusercontent.com/DevSpen/scam-links/master/src/links.txt')).data } catch (err) { sources[2] = ''; }
    try { sources[3] = (await axios.get('https://raw.githubusercontent.com/nikolaischunk/discord-phishing-links/main/domain-list.json')).data } catch (err) { sources[3] = []; }
    try { sources[4] = []/*(await axios.get('https://raw.githubusercontent.com/Segasec/PhishingFeed/master/phishing-domains-sha256.json')).data*/ } catch (err) { sources[4] = []; }
    try { sources[5] = fs.readFileSync("./localMaliciousLinks.txt", 'utf-8').split('\n') } catch (err) { sources[6] = []; }
    try { sources[6] = []/*(await axios.get('https://raw.githubusercontent.com/Segasec/feed/master/phishing-domains.json')).data*/ } catch (err) { sources[6] = []; }
    try { sources[7] = (await axios.get('https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts')).data } catch (err) { sources[7] = ''; }
    sources[8] = [];

    interface Source {
        name: string;
        enabled: boolean;
        format: string;
        args: string[];
        url: string;
    }

    let extraSources: Source[] = (await axios.get('https://raw.githubusercontent.com/hectorm/hmirror/master/sources.json')).data.sources;
    extraSources.forEach(async (source: Source) => {
        let newSources = (await axios.get(source.url)).data;
        if (source.url.endsWith('.txt')) newSources = hostFileToDomains(newSources);
        else if (source.url.endsWith('.json')) {
            const sourcesJson = JSON.parse(JSON.stringify(newSources));
            newSources = [];
            const categories = sourcesJson.categories
            for (let i in categories) {
                const category = categories[i]
                category.forEach(domain => {
                    let key = Object.keys(domain)[0];
                    let key2 = Object.keys(domain[key])[0];
                    let urls = []
                    domain[key][key2].forEach(url => {
                        urls.push(url)
                    })

                    newSources.push(...urls)
                })
            }
        }
    })

    //sources[0] = JSON.parse(sources[0]); //Hashes Array
    //sources[1] = sources[1]; //URL Text
    //sources[2] = sources[2]; //URL Text
    sources[3] = sources[3].domains; //URL Array
    //sources[4] = JSON.parse(sources[4]); //Hashes Array
    //sources[6] = JSON.parse(sources[6]); //URL Array
    sources[7] = hostFileToDomains(sources[7]); //Hosts File

    sources[1] = sources[1].split("\n");
    sources[1] = sources[1].map((url) => { return sha256(url); });

    sources[2] = sources[2].split("\n");
    sources[2] = sources[2].map((url) => { return sha256(url); });

    sources[3] = sources[3].map((url) => { return sha256(url); });
    //sources[5] = sources[5].map((url) => { return sha256(url); });
    sources[6] = sources[6].map((url) => { return sha256(url); });
    sources[7] = sources[7].map((url) => { return sha256(url); });

    sources[8] = sources[8].map((url) => { return sha256(url); });

    //Merge all sources, making sure no duplicates
    let connedArray = sources.reduce((acc, cur) => {
        return acc.concat(cur);
    }, []);

    let combinedHashes = [...new Set(connedArray)] as string[];
    fs.writeFileSync('./localMaliciousLinks.txt', combinedHashes.join("\n"));

    return combinedHashes;
}

async function init() {
    MaliciousLinks = await getBadLinks();
}

// Process Punishments
setInterval(() => {
    // TODO: Make recent punishments be based on type/duration vs reason. (ex: Can only mute once every 10 seconds unless the new mute is longer)
    if (PunishmentQueue.length == 0) return;

    PunishmentQueue.forEach(async punishmentInfo => {
        const punishment = punishmentInfo.punishment;
        const channel = punishmentInfo.channel;

        if (!RecentPunishments.has(punishment.target._id)) RecentPunishments.set(punishment.target._id, []);
        const recentPunishments = RecentPunishments.get(punishment.target._id);
        let wasRecentlyPunished = false;

        recentPunishments.forEach(recentPunishment => {
            if (Date.now() - recentPunishment.time > 30000) recentPunishments.splice(recentPunishments.indexOf(recentPunishment), 1);
            else if (recentPunishment.reason == punishment.reason) wasRecentlyPunished = true;
        });

        if (!wasRecentlyPunished) {
            punishment.run(channel);
            recentPunishments.push({ reason: punishment.reason, time: Date.now() });
            RecentPunishments.set(punishment.target._id, recentPunishments);
        }
        else console.log(`Skipping Punishment`);
        PunishmentQueue.splice(PunishmentQueue.indexOf(punishmentInfo), 1);
    })
}, 500);

// Update Malicious Links list every hour.
setInterval(async () => {
    MaliciousLinks = await getBadLinks();
}, 3600000)

interface PunishmentInfo {
    punishment: Punishment;
    channel: Channel;
}

interface RecentPunishmentInfo {
    time: number;
    reason: string;
}

export function timeToText(time: number): string {
    if (time <= 0) return "forever";

    let seconds = Math.floor(time / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    let years = Math.floor(days / 365);
    let months = Math.floor(days / 30);
    let weeks = Math.floor(days / 7);

    months = months % 12;
    weeks = weeks % 4;
    days = days % 7;
    hours = hours % 24;
    minutes = minutes % 60;
    seconds = seconds % 60;

    let text = ``;
    if (years > 0) text += `${years} year${years > 1 ? "s" : ""}`;
    if (months > 0) { if (text != "") text += ", "; text += `${months} month${months > 1 ? "s" : ""}`; }
    if (days > 0) { if (text != "") text += ", "; text += `${days} day${days > 1 ? "s" : ""}`; }
    if (hours > 0) { if (text != "") text += ", "; text += `${hours} hour${hours > 1 ? "s" : ""}`; }
    if (minutes > 0) { if (text != "") text += ", "; text += `${minutes} minute${minutes > 1 ? "s" : ""}`; }
    if (seconds > 0) { if (text != "") text += ", "; text += `${seconds} second${seconds > 1 ? "s" : ""}`; }

    return text;
}

export function toSec(ms: number): number {
    return Math.floor(ms / 1000);
}

function hostFileToDomains(hostFile: string): string[] {
    let domains: string[] = [];
    let urls = hostFile.split('\n');
    urls.forEach(url => {
        if (url.startsWith(`0.0.0.0`)) {
            let domain = url.split(' ')[1];
            domains.push(domain)
        }
    })

    return domains
}