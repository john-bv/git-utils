import { Command } from "cli/lib/Command.js";
import { ListLabels } from "./labels/ListLabels.js";
import { DeleteLabel } from "./labels/DeleteLabel.js";
import { CopyLabels } from "./labels/CopyLabels.js";

export const commands: Command[] = [
    new ListLabels,
    new DeleteLabel,
    new CopyLabels
];