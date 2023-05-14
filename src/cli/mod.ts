export const VERSION: string = "0.0.1";
import { logHelp } from "./util.js";
import colors from 'colors';
import { FlagError } from './lib/Flag.js';
import { Command } from "./lib/Command.js";

export async function run(commands: Command[]) {
    // // get command arguments
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log(colors.red('No arguments provided. Use help to see avalible options.'));
        process.exit();
    }

    // hijack the help command
    if (args[0] === 'help') {
        logHelp(commands);
        process.exit();
    }

    const possibleCommand = commands.find(cmd => cmd.name === args[0]);

    if (!possibleCommand) {
        console.log(colors.red(`Unknown command: ${args[0]}!`) + colors.gray(` Use ${colors.yellow('help')} to see avalible options.`));
        process.exit();
    }

    let errors: FlagError[] = [];
    let flags: Record<string, { value?: any, exists: boolean }> = {};

    // parse flags
    for (let flag of possibleCommand.flags) {
        try {
            let res = flag.tryParseFrom(args);

            if (res.exists) {
                // @ts-ignore
                flags[flag.name] = res;
            }
        } catch (e: any) {
            errors.push(e);
        }
    };

    const error = errors[0];

    if (error) {
        // get the reason for the flag
        let msgs: string[] = [];
        if (error.reasons.missing) {
            msgs.push(
                colors.gray(`${possibleCommand.name}`) +
                colors.red(` requires the flag: ${colors.yellow('--' + error.flag.name)}, but it was not provided.`)
            );
        }
        if (error.reasons.missingValue) {
            msgs.push(
                colors.gray(`${possibleCommand.name}`) +
                colors.red(` requires a value for the flag: ${colors.yellow('--' + error.flag.name)}, but it was not provided.`)
            );
        }
        if (error.reasons.invalidValue) {
            msgs.push(
                colors.red(`Provided flag --${error.flag.name} is invalid because it expected type: `) +
                colors.yellow(`${error.valueName}`) +
                colors.red(`, but got: `) +
                colors.yellow(`${error.value?.toString() || 'none'}`)
            );
        }
        msgs.push(
            colors.red(`Use ${colors.yellow(`help ${possibleCommand.name} --${error.flag.name}`)} to see avalible options.`)
        )
        console.log(msgs.join('\n'));
        process.exit();
    }

    await possibleCommand.run(flags);
}