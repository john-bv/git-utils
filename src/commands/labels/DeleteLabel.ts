import { Command } from "../../cli/lib/Command.js";
import { Flag } from "../../cli/lib/Flag.js";
import { client } from "../../modules/init.js";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import colors from 'colors';

export class DeleteLabel extends Command {
    public name: string = 'delete-label';
    public description: string = 'Deletes the specified label(s) from the repository.';
    public flags = [
        new Flag('repository', {
            required: true,
            aliases: ['repo', 'r'],
            description: 'The repository to list labels from.',
            value: /(?:[a-z0-9\-]*\/[a-z0-9\-_]*)/ig,
            examples: [
                "{cmd} {arg} --repository github/docs"
            ]
        }),
        new Flag('label', {
            required: false,
            aliases: ['l'],
            description: 'The label to delete.',
            value: /(?:[a-z0-9\-]*)/ig,
            examples: [
                "{cmd} {arg} --label bug"
            ]
        }),
        new Flag('all', {
            required: false,
            aliases: ['a'],
            description: 'Delete all labels.',
            examples: [
                "{cmd} {arg} --all",
            ]
        })
    ];

    public async run(flags: Record<string, { value?: any, exists: boolean }>) {
        const { repository, all, label } = flags;

        if (!repository.value) {
            Error().expect(colors.red('No repository provided.'));
        }

        const labels = await client.rest.issues.listLabelsForRepo({
            owner: repository.value.split('/')[0],
            repo: repository.value.split('/')[1]
        }).expect(`Failed to get labels for repo ${repository.value}.`);

        if (label && label.exists) {
            if (!labels.data.includes(label.value)) {
                console.log(colors.red(`Label ${label.value} does not exist in ${repository.value}.`));
                return;
            }
            await client.rest.issues.deleteLabel({
                owner: repository.value.split('/')[0],
                repo: repository.value.split('/')[1],
                name: label.value
            }).expect(`Failed to delete label ${label.value} from ${repository.value}.`);
            console.log(`Deleted label ${colors.blue(label.value)} from ${colors.green(repository.value)}.`);
        } else if (all && all.exists) {
            const rl = readline.createInterface({
                input,
                output
            });
            const answer = await rl.question(`Are you sure you want to delete all labels from ${colors.green(repository.value)}? (y/n) `);
            rl.close();
            if (answer.toLowerCase() === 'y'  || answer.toLowerCase() === 'yes') {
                for (const label of labels.data) {
                    try {
                        await client.rest.issues.deleteLabel({
                            owner: repository.value.split('/')[0],
                            repo: repository.value.split('/')[1],
                            name: label.name
                        });
                        console.log(`Deleted label ${colors.blue(label.name)} from ${colors.green(repository.value)}.`);
                    } catch (e) {
                        console.log(colors.red(`Failed to delete label ${label.name} from ${repository.value}.`))
                    }
                }
            } else {
                console.log(colors.red(`Aborted.`));
            }
        } else {
            console.log(colors.red(`Either --label or --all must be provided.`));
        }
    }
}