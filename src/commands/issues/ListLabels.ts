import { expect } from "../../libs/expect.js";
import { Command } from "../../cli/lib/Command.js";
import { Flag } from "../../cli/lib/Flag.js";
import { client } from "../../modules/init.js";
import colors from 'colors';

export class ListLabels extends Command {
    public name: string = 'list-labels';
    public description: string = 'List all labels in a repository.';
    public flags = [
        new Flag('repository', {
            required: true,
            description: 'The repository to list labels from.',
            value: /(?:[a-z0-9\-]*\/[a-z0-9\-_]*)/ig,
            examples: [
                "{cmd} {arg} --repository github/docs"
            ]
        })
    ]

    public async run(flags: Record<string, { value?: any, exists: boolean }>) {
        const { repository } = flags;

        if (!repository.exists) {
            Error().expect('No repository provided.');
        }

        if (!repository.value) {
            Error().expect('No repository provided.');
        }

        const labels = await client.rest.issues.listLabelsForRepo({
            owner: repository.value.split('/')[0],
            repo: repository.value.split('/')[1]
        }).expect(`Failed to get labels for repo ${repository.value}.`);

        console.log(`There are ${colors.blue(`${labels.data.length}`)} labels for ${colors.green(repository.value)}:`);
        console.log(labels.data.map(label => `- ${colors.blue(label.name)} (${colors.green(label.color)}): ${colors.grey(label.description ? `${label.description}` : '')}`).join('\n'));
    }
}