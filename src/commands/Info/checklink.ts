import { Command } from "../../structures/Command";
import { findLinks } from 'links-finder';
import urlParse from 'url-parse'
import { sha256 } from 'js-sha256';
import { MaliciousLinks } from '../../run';

export default new Command({
    name: 'checklink',
    description: 'Lets you check a link to see if it\'s malicious without needing to trigger the automod.',
    options: [
        {
            name: 'link',
            description: 'The link to check',
            type: 'STRING',
            required: true
        }
    ],
    hidden: false,
    run: async ({ client, interaction }) => {
        const link = interaction.options.getString('link', true);

        const linkPositions = findLinks(link);
        let links = [];
        linkPositions.forEach((linkPosition) => {
            links.push(
                link
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

        if (containsBadLink) interaction.editReply(`\`${link}\` is known to be a malicious link!`)
        else interaction.editReply(`\`${link}\` is not known to be a malicious link!`)
    }
})