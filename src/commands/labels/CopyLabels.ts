import { Command } from "../../cli/lib/Command.js";
import { Flag } from "../../cli/lib/Flag.js";
import { client } from "../../modules/init.js";
import colors from 'colors';

export class CopyLabels extends Command {
    public name: string = 'copy-labels';
    public description: string = 'Copies labels from one repository to another.';
    public flags = [
        new Flag('from', {
            required: true,
            aliases: ['f'],
            description: 'The repository to copy labels from.',
            value: /(?:[a-z0-9\-]*\/[a-z0-9\-_]*)/ig,
            examples: [
                "{cmd} {arg} --from github/docs --to foo/bar",
            ]
        }),
        new Flag('to', {
            required: true,
            aliases: ['t'],
            description: 'The repository to copy labels to.',
            value: /(?:[a-z0-9\-]*\/[a-z0-9\-_]*)/ig,
            examples: [
                "{cmd} {arg} --to github/docs"
            ]
        })
    ];

    public async run(flags: Record<string, { value?: any, exists: boolean }>) {
        const { from, to } = flags;

        // get labels from the from repository
        const labels = await client.rest.issues.listLabelsForRepo({
            owner: from.value.split('/')[0],
            repo: from.value.split('/')[1]
        }).expect(colors.red(`Failed to get labels for repo ${from.value}.`));

        // get labels from the to repository
        const toLabels = await client.rest.issues.listLabelsForRepo({
            owner: to.value.split('/')[0],
            repo: to.value.split('/')[1]
        }).expect(colors.red(`Failed to get labels for repo ${to.value}.`));

        // create labels in the to repository
        for (let label of labels.data) {
            try {
                // check if the label already exists
                if (toLabels.data.find(l => l.name === label.name)) {
                    console.log(colors.yellow(`Label ${colors.blue(label.name)} already exists in ${colors.green(to.value)} skipping...`));
                    continue;
                }
                await client.rest.issues.createLabel({
                    owner: to.value.split('/')[0],
                    repo: to.value.split('/')[1],
                    name: label.name,
                    color: label.color,
                    description: label.description || ''
                });
                console.log(colors.green(`Created label ${colors.blue(label.name)} in ${colors.green(to.value)}.`));
            } catch {
                console.log(colors.red(`Failed to create label ${colors.yellow(label.name)} in ${colors.yellow(to.value)}.`));
            }
        }
    }
}