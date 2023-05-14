import { Command } from "cli/lib/Command.js";
import { ListLabels } from "./issues/ListLabels.js";

export const commands: Command[] = [
    new ListLabels()
];