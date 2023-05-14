import { Flag } from "./Flag.js";

export abstract class Command {
    public abstract name: string;
    public abstract description: string;
    public abstract flags: Flag[];
    public abstract run(args: Record<string, { value?: any }>): PromiseLike<any> | any;

    public getHelp() {
        return `   ${this.name.padEnd(25)}${this.description}`;
    }

    public validate() {
        // validates if the given arguments (flags) are valid
    }

    public parseFlags() {

    }
}