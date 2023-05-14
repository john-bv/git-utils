import { client } from "../init.js";
import { RepositoryOrigin } from "../common.js";
import colors from 'colors';

export async function copyLabels(from: RepositoryOrigin, to: RepositoryOrigin, overwrite: boolean = false): Promise<boolean> {
    const fromLabels = await client.rest.issues.listLabelsForRepo({
        owner: from.owner,
        repo: from.repo
    }).expect(`Failed to get labels for repo ${from.owner}/${from.repo}.`);

    const toLabels = await client.rest.issues.listLabelsForRepo({
        owner: to.owner,
        repo: to.repo
    }).expect(`Failed to get labels for repo ${to.owner}/${to.repo}.`)
    ;
    const toLabelNames = toLabels.data.map(label => label.name);
    for (const label of fromLabels.data) {
        if (toLabelNames.includes(label.name) && !overwrite) {
            continue;
        }
        if (!toLabelNames.includes(label.name)) {
            await client.rest.issues.createLabel({
                owner: to.owner,
                repo: to.repo,
                name: label.name,
                color: label.color
            });
        }
    }
    return true;
}