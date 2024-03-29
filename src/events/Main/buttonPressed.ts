import { Event } from '../../structures/Event';
import { InteractionCache, timeToText, toSec } from '../../run';
import { Punishment } from '../../structures/Punishment';
import { Channel } from '../../structures/Channel';
import { MessageComponents } from '../../structures/MessageComponents';
import { Embed } from '../../structures/Embed';
import { HistoryEntry, Note } from '../../typings/Member';

export default new Event('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        await interaction.deferUpdate().catch(err => { console.error(err) });
        
        const id = interaction.customId.split('|')[0];
        const action = interaction.customId.split('|')[1];
        let data = InteractionCache.get(id);
        if (data == null) {
            interaction.editReply({
                content: `This interaction has expired.`,
                embeds: [],
                components: []
            })
            return;
        }

        switch (data.type) {
            case 'punishment': {
                data = data as PunishmentInterfaceCacheData;
                if (action == 'Yes') {
                    await data.punishment.run(data.channel)
                    interaction.editReply({
                        content: `Punishment Executed`,
                        embeds: [data.punishment.getEmbed().embed],
                        components: []
                    })
                } else {
                    interaction.editReply({
                        content: `Punishment Canceled`,
                        embeds: [],
                        components: []
                    })
                }

                InteractionCache.remove(id);
            }; break;

            case 'history': {
                let entriesPerPage = 6;
                let { filters, page, activeOnly, member } = data;

                if (action == 'ShowInactive') activeOnly = false;
                if (action == 'HideInactive') activeOnly = true;

                const rawHistory = member.moderation.history as HistoryEntry[];
                let history = rawHistory.filter(entry => {
                    if (activeOnly) return entry.expires > Date.now() || entry.expires == -1
                    else return true
                });

                if (action == 'First') page = 0;
                if (action == 'Back') page--;
                if (action == 'Next') page++;
                if (action == 'Last') page = Infinity;

                if (page < 0) page = 0;
                if (page > history.length / entriesPerPage) page = Math.floor(history.length / entriesPerPage);

                data.page = page;
                data.activeOnly = activeOnly;
                InteractionCache.save(id, data);

                let embed = new Embed();

                embed.setTitle(`${member.displayName}'s History`);
                embed.setColor(0xff0000)
                let text = ``;
                text += `Total Punishments: ${member.moderation.history.length}\n`;
                text += `Filters:\n`;
                text += `${filters.includes('warn') ? '🟩' : '🟥'} Warnings\n`;
                text += `${filters.includes('mute') ? '🟩' : '🟥'} Mutes\n`;
                text += `${filters.includes('quarantine') ? '🟩' : '🟥'} Quarantines\n`;
                text += `${filters.includes('kick') ? '🟩' : '🟥'} Kicks\n`;
                text += `${filters.includes('softban') ? '🟩' : '🟥'} Softbans\n`;
                text += `${filters.includes('ban') ? '🟩' : '🟥'} Bans\n`;
                text += `${!activeOnly ? '🟩' : '🟥'} Inactive Punishments`;

                embed.setDescription(text);
                
                for (let i = page * entriesPerPage; i < history.length && i < (page * entriesPerPage) + entriesPerPage; i++) {
                    if (i % 2 == 0) embed.addBlankField();
                    let entry = history[i];

                    let text = ``;
                    text += `Actor: <@${entry.actor}>\n`;
                    text += `Reason: ${entry.reason}\n`;
                    text += `Duration: ${entry.duration ? timeToText(entry.duration) : 'Permanent'}\n`;
                    if (entry.expires > Date.now() || entry.expires == -1) text += `Expires: ${entry.expires != -1 ? `<t:${toSec(entry.expires)}:R>` : 'Never'}\n`;
                    else text += `Expired: <t:${toSec(entry.expires)}:R>\n`;
                    embed.addField(`${entry.type}`, text, true);
                }

                embed.setFooter(`Page ${page + 1}/${Math.ceil(history.length / entriesPerPage)}`);

                let components = new MessageComponents();

                components.addRow();
                components.addButton(0, {
                    label: '<< First',
                    style: 'SECONDARY',
                    customId: `${data._id}|First`,
                    disabled: !(page > 0)
                })
                components.addButton(0, {
                    label: '< Back',
                    style: 'SECONDARY',
                    customId: `${data._id}|Back`,
                    disabled: !(page > 0)
                })
                components.addButton(0, {
                    label: 'Next >',
                    style: 'SECONDARY',
                    customId: `${data._id}|Next`,
                    disabled: !(page < Math.floor(history.length / entriesPerPage))
                })
                components.addButton(0, {
                    label: 'Last >>',
                    style: 'SECONDARY',
                    customId: `${data._id}|Last`,
                    disabled: !(page < Math.floor(history.length / entriesPerPage))
                })

                components.addRow();
                components.addSelectMenu(1, {
                    placeholder: 'Select Filters',
                    customId: `${data._id}|Filters`,
                    minValues: 1,
                    maxValues: 6,
                    options: [
                        {
                            label: 'Warnings',
                            value: 'warn',
                            //default: filters.includes('warn')
                        },
                        {
                            label: 'Mutes',
                            value: 'mute',
                            //default: filters.includes('mute')
                        },
                        {
                            label: 'Quarantines',
                            value: 'quarantine',
                            //default: filters.includes('quarantine')
                        },
                        {
                            label: 'Kicks',
                            value: 'kick',
                            //default: filters.includes('kick')
                        },
                        {
                            label: 'Softbans',
                            value: 'softban',
                            //default: filters.includes('softban')
                        },
                        {
                            label: 'Bans',
                            value: 'ban',
                            //default: filters.includes('ban')
                        }
                    ]
                })

                components.addRow();
                components.addButton(2, {
                    label: 'Show Inactive',
                    style: 'SUCCESS',
                    customId: `${data._id}|ShowInactive`,
                    disabled: !activeOnly
                })
                components.addButton(2, {
                    label: 'Hide Inactive',
                    style: 'DANGER',
                    customId: `${data._id}|HideInactive`,
                    disabled: activeOnly
                });

                interaction.editReply({
                    embeds: [embed.embed],
                    components: components.actionRows
                }).catch(err => { });
            }; break;

            case 'notes': {
                let entriesPerPage = 6;
                let { page, member } = data;

                const notes = member.moderation.notes as Note[];

                if (action == 'First') page = 0;
                if (action == 'Back') page--;
                if (action == 'Next') page++;
                if (action == 'Last') page = Infinity;

                if (page < 0) page = 0;
                if (page > notes.length / entriesPerPage) page = Math.floor(notes.length / entriesPerPage);

                data.page = page;
                InteractionCache.save(id, data);

                let embed = new Embed();

                embed.setTitle(`${member.displayName}'s Notes`);
                embed.setColor(0xff0000)
                let text = ``;
                text += `Note Count: ${member.moderation.notes.length}\n`;

                embed.setDescription(text);

                for (let i = page * entriesPerPage; i < notes.length && i < (page * entriesPerPage) + entriesPerPage; i++) {
                    if (i % 2 == 0) embed.addBlankField();
                    let note = notes[i];

                    embed.addField(`${i + 1}: ${note.author}`, note.note, true);
                }

                if (notes.length == 0) embed.addField(`There's nothing here!`, `This user has no notes.`);

                embed.setFooter(`Page ${page + 1}/${Math.ceil(notes.length / entriesPerPage)}`);

                let components = new MessageComponents();

                components.addRow();
                components.addButton(0, {
                    label: '<< First',
                    style: 'SECONDARY',
                    customId: `${data._id}|First`,
                    disabled: !(page > 0)
                })
                components.addButton(0, {
                    label: '< Back',
                    style: 'SECONDARY',
                    customId: `${data._id}|Back`,
                    disabled: !(page > 0)
                })
                components.addButton(0, {
                    label: 'Next >',
                    style: 'SECONDARY',
                    customId: `${data._id}|Next`,
                    disabled: !(page < Math.floor(notes.length / entriesPerPage))
                })
                components.addButton(0, {
                    label: 'Last >>',
                    style: 'SECONDARY',
                    customId: `${data._id}|Last`,
                    disabled: !(page < Math.floor(notes.length / entriesPerPage))
                })

                interaction.editReply({
                    embeds: [embed.embed],
                    components: components.actionRows
                }).catch(err => { });
            }; break;
        }
    }
})

interface InteractionCacheData {
    id: string;
    type: string;
}

interface PunishmentInterfaceCacheData extends InteractionCacheData {
    punishment: Punishment;
    channel: Channel;
}