import { Server } from '../../structures/Server';
import { Command } from '../../structures/Command';
import { Member } from '../../structures/Member';
import { Embed } from '../../structures/Embed';
import { InteractionCache } from '../../run'
import { MessageComponents } from '../../structures/MessageComponents';

export default new Command({
    name: 'notes',
    description: 'See a user\'s notes.',
    options: [{
        name: 'user',
        description: 'The user to get notes for.',
        type: 'USER',
        required: true,
    }],
    hidden: false,
    run: async ({ interaction, args }) => {
        let server = await (new Server(interaction.guild)).init();
        let actor = await (new Member(server, interaction.member.id)).init();

        if (!actor.canRunCommand('notes')) {
            interaction.editReply(`You dont have permission to run this command!`);
            return;
        }

        let user = await (new Member(server, args.getUser('user', true).id)).init();

        const interactionCacheData = {
            id: InteractionCache.uuid(),
            type: 'notes',
            page: 0,
            member: user
        }
        InteractionCache.save(interactionCacheData.id, interactionCacheData);

        const { page } = interactionCacheData;
        let embed = new Embed();

        embed.setTitle(`${user.displayName}'s Notes`);
        embed.setColor(0xff0000)
        let text = ``;
        text += `Note Count: ${user.moderation.notes.length}\n`;

        embed.setDescription(text);

        const notes = user.moderation.notes;
        const entriesPerPage = 6;
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
            customId: `${interactionCacheData.id}|First`,
            disabled: true
        })
        components.addButton(0, {
            label: '< Back',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|Back`,
            disabled: true
        })
        components.addButton(0, {
            label: 'Next >',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|Next`,
            disabled: notes.length < entriesPerPage
        })
        components.addButton(0, {
            label: 'Last >>',
            style: 'SECONDARY',
            customId: `${interactionCacheData.id}|Last`,
            disabled: notes.length < entriesPerPage
        })

        interaction.editReply({
            embeds: [embed.embed],
            components: components.actionRows
        }).catch(err => {});
    }
})