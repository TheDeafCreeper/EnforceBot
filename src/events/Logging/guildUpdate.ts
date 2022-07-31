import { Guild } from 'discord.js';
import { Event } from '../../structures/Event';
import { Server } from '../../structures/Server';
import { Embed } from '../../structures/Embed';

export default new Event('guildUpdate', async (oldGuild: Guild, newGuild: Guild) => {
    let server = await (new Server(oldGuild)).init();

    let embed = new Embed();
    embed.setTitle('Server Updated');
    embed.setColor(0xffff00)

    if (oldGuild.name != newGuild.name)
        embed.addField(`Server Name:`, `${oldGuild.name} >> ${newGuild.name}`)

    if (oldGuild.description != newGuild.description)
        embed.addField(`Server Description:`, `${oldGuild.description} >> ${newGuild.description}`)

    if (oldGuild.icon != newGuild.icon)
        embed.addField(`Server Icon:`, `${oldGuild.iconURL()} >> ${newGuild.iconURL()}`)

    if (oldGuild.afkChannelId != newGuild.afkChannelId)
        embed.addField(`AFK Channel:`, `<#${oldGuild.afkChannelId}> >> <#${newGuild.afkChannelId}>`)

    if (oldGuild.afkTimeout != newGuild.afkTimeout)
        embed.addField(`AFK Timeout:`, `${oldGuild.afkTimeout} >> ${newGuild.afkTimeout}`)

    if (oldGuild.bannerURL() != newGuild.bannerURL())
        embed.addField(`Server Banner:`, `${oldGuild.bannerURL()} >> ${newGuild.bannerURL()}`) //TODO: Change this slightly

    if (oldGuild.discoverySplashURL() != newGuild.discoverySplashURL())
        embed.addField(`Discovery Splash:`, `${oldGuild.discoverySplash} >> ${newGuild.discoverySplash}`)

    if (oldGuild.explicitContentFilter != newGuild.explicitContentFilter)
        embed.addField(`Explicit Content Filter:`, `${oldGuild.explicitContentFilter} >> ${newGuild.explicitContentFilter}`)

    if (oldGuild.maximumMembers != newGuild.maximumMembers)
        embed.addField(`Maximum Members:`, `${oldGuild.maximumMembers} >> ${newGuild.maximumMembers}`)

    if (oldGuild.maximumPresences != newGuild.maximumPresences)
        embed.addField(`Maximum Presences:`, `${oldGuild.maximumPresences} >> ${newGuild.maximumPresences}`)

    if (oldGuild.mfaLevel != newGuild.mfaLevel)
        embed.addField(`MFA Level:`, `${oldGuild.mfaLevel} >> ${newGuild.mfaLevel}`)

    if (oldGuild.verificationLevel != newGuild.verificationLevel)
        embed.addField(`Verification Level:`, `${oldGuild.verificationLevel} >> ${newGuild.verificationLevel}`)

    if (oldGuild.nsfwLevel != newGuild.nsfwLevel)
        embed.addField(`NSFW Level:`, `${oldGuild.nsfwLevel} >> ${newGuild.nsfwLevel}`)

    if (oldGuild.partnered != newGuild.partnered)
        embed.addField(`Partnered:`, `${oldGuild.partnered} >> ${newGuild.partnered}`)

    if (oldGuild.premiumProgressBarEnabled != newGuild.premiumProgressBarEnabled)
        embed.addField(`Premium Progress Bar:`, `${oldGuild.premiumProgressBarEnabled} >> ${newGuild.premiumProgressBarEnabled}`)

    if (oldGuild.premiumTier != newGuild.premiumTier)
        embed.addField(`Premium Tier:`, `${oldGuild.premiumTier} >> ${newGuild.premiumTier}`)

    if (oldGuild.preferredLocale != newGuild.preferredLocale)
        embed.addField(`Preferred Locale:`, `${oldGuild.preferredLocale} >> ${newGuild.preferredLocale}`)

    if (oldGuild.publicUpdatesChannel != newGuild.publicUpdatesChannel)
        embed.addField(`Public Updates Channel:`, `${oldGuild.publicUpdatesChannel} >> ${newGuild.publicUpdatesChannel}`)

    if (oldGuild.rulesChannel != newGuild.rulesChannel)
        embed.addField(`Rules Channel:`, `${oldGuild.rulesChannel} >> ${newGuild.rulesChannel}`)

    if (oldGuild.vanityURLCode != newGuild.vanityURLCode)
        embed.addField(`Vanity URL:`, `${oldGuild.vanityURLCode} >> ${newGuild.vanityURLCode}`)

    if (oldGuild.verified != newGuild.verified)
        embed.addField(`Verified:`, `${oldGuild.verified} >> ${newGuild.verified}`)

    if (oldGuild.widgetEnabled != newGuild.widgetEnabled)
        embed.addField(`Allow Widgets:`, `${oldGuild.widgetEnabled} >> ${newGuild.widgetEnabled}`)

    embed.setFooter(oldGuild.id)
    server.sendLog('guildUpdate', { embeds: [embed.embed] }, null, null);
});