import colors from 'colors';
import { Command } from './lib/Command.js';
import { Flag } from './lib/Flag.js';

function replaceCmdAndArg(str: string, name: string, flag: string) {
    return str
        .replaceAll(/\{cmd\}/ig, colors.green(name))
        .replaceAll(/\{arg\}/ig, colors.yellow('--' + flag))
        .replaceAll(/\{flag\}/ig, colors.yellow('--' + flag))
        .replaceAll(/\{gold\: ?([^{\}]+)\}/ig, colors.yellow('$1'))
        .replaceAll(/\{green\: ?([^{\}]+)\}/ig, colors.green('$1'))
        .replaceAll(/\{red\: ?([^{\}]+)\}/ig, colors.red('$1'))
        .replaceAll(/\{gray\: ?([^{\}]+)\}/ig, colors.gray('$1'))
        .replaceAll(/\{bold\: ?([^{\}]+)\}/ig, colors.bold('$1'))
        .replaceAll(/\{underline\: ?([^{\}]+)\}/ig, colors.underline('$1'))
        .replaceAll(/\{italic\: ?([^{\}]+)\}/ig, colors.italic('$1'))
        .replaceAll(/\{inverse\: ?([^{\}]+)\}/ig, colors.inverse('$1'))
        .replaceAll(/\{strikethrough\: ?([^{\}]+)\}/ig, colors.strikethrough('$1'))
        .replaceAll(/\{white\: ?([^{\}]+)\}/ig, colors.white('$1'))
        .replaceAll(/\{grey\: ?([^{\}]+)\}/ig, colors.grey('$1'))
        .replaceAll(/\{black\: ?([^{\}]+)\}/ig, colors.black('$1'))
        .replaceAll(/\{blue\: ?([^{\}]+)\}/ig, colors.blue('$1'))
        .replaceAll(/\{cyan\: ?([^{\}]+)\}/ig, colors.cyan('$1'))
        .replaceAll(/\{magenta\: ?([^{\}]+)\}/ig, colors.magenta('$1'))
        .replaceAll(/\{yellow\: ?([^{\}]+)\}/ig, colors.yellow('$1'))
        .replaceAll(/\{rainbow\: ?([^{\}]+)\}/ig, colors.rainbow('$1'))
        .replaceAll(/\{zebra\: ?([^{\}]+)\}/ig, colors.zebra('$1'))
        .replaceAll(/\{america\: ?([^{\}]+)\}/ig, colors.america('$1'))
        .replaceAll(/\{trap\: ?([^{\}]+)\}/ig, colors.trap('$1'))
        .replaceAll(/\{random\: ?([^{\}]+)\}/ig, colors.random('$1'))
        .replaceAll(/\{reset: ?([^{\}]+)\}/ig, colors.reset('$1'));
}

export function logHelpFor(command: Command) {
    // if (!avalibleOpts[name]) {
    //     console.log(colors.red(`No help message for ${name}`));
    //     return;
    // }

    const name = command.name;
    const args = process.argv.slice(2);

    let flags: Record<string, { value?: any, exists: boolean }> = {};

    // parse flags
    for (let flag of command.flags) {
        try {
            let res = flag.tryParseFrom(args);

            if (res.exists) {
                // @ts-ignore
                flags[flag.name] = res;
            }
        } catch (e: any) {
            if (e.reasons.missingValue && e.reasons.missingValue === true) {
                flags[flag.name] = { exists: true };
            }
        }
    };

    if (Object.keys(flags).length > 0) {
        // these are the valid flags we can log help for, so log it
        for (let [name, { exists }] of Object.entries(flags)) {
            if (!exists) continue;

            console.log(`COMMAND: ${colors.green(command.name)} ${colors.yellow('--' + name)}`);

            const flag = command.flags.find(f => f.name === name) as Flag;
            let msg = '';

            if (flag.options.required) {
                msg += colors.red('   (REQUIRED)') + colors.gray(` This argument is required for ${colors.green(command.name)}\n\n`);
            }

            msg += `   DESCRIPTION: \n      ${colors.gray(flag.options.description ?? "None Provided.")}\n\n`;
            msg += `   EXAMPLES:`;
            if (flag.options.examples && flag.options.examples.length > 0) {
                msg += colors.gray(`\n      `);
                msg += flag.options.examples.map(ex => colors.gray(replaceCmdAndArg(ex, command.name, flag.name))).join(colors.gray(`\n      `));
            } else {
                msg += colors.gray(`\n      No examples provided for this argument.`);
            }

            msg += colors.reset('\n\n   USAGE:');
            msg += colors.reset('\n      ' + colors.underline(colors.green(`${command.name}`)) + colors.gray(` ${replaceCmdAndArg(flag.getUsage(), command.name, flag.name) || ''}`));
            msg += colors.reset('\n');

            console.log(msg);
        }

        if (Object.keys(flags).length > 1) {
            console.log(
                '\n',
                colors.white(colors.bold('NOTE: ') + colors.white('Multiple flags are present! It is recommended to only use one flag at a time when viewing help for each flag.'))
            );
        }
        return;
    }

    // log the command with its flags
    let msg = `COMMAND: ${colors.green(name)}`;
    msg += colors.gray(`\n   ${command.description}`);

    msg += colors.reset('\n\nARGUMENTS:');
    for (let arg of command.flags) {
        let required = arg.options.required ? colors.red(colors.bold('Required')) : '';
        let examples = arg.options.examples && arg.options.examples.length > 0 ? colors.cyan('EX') : '';
        let aliasList = (arg.options.aliases || []).map(alias => `-${alias}`).join(', ');
        let loggableAliases = aliasList ? ` (${aliasList})` : '';
        msg += colors.reset('\n   ' + colors.yellow(`--${arg.options.name}`) + colors.gray(loggableAliases) + ': ' + [required, examples].filter(c => c != '').join(', '));
        msg += colors.gray(`\n     ${arg.options.description}\n`);

    }

    msg += colors.reset('\nUSAGE:');
    // generate usage message(s)
    for (let arg of command.flags) {
        msg += colors.reset('\n   ' + colors.underline(colors.green(`${name}`)) + ' ' + colors.gray(replaceCmdAndArg(arg.getUsage(), command.name, arg.name)));
    }

    msg += colors.reset('\n\nNOTE:');
    msg += colors.reset('\n   ' + colors.gray(`${colors.cyan('EX')} = Examples present with the ${colors.green('help <command> <arg>')} syntax.`));

    console.log(msg);
}

export function logHelp(commands?: Command[]) {
    const args = process.argv.slice(2);
    const longestNamedCommand = commands?.sort((a, b) => b.name.length - a.name.length)[0].name.length ?? 0;

    if (args[1]) {
        // hijack the help command
        if (args[1] === 'help') {
            console.log(colors.red('To view help for a command, use: ') + colors.yellow('help <command>'));
            return;
        }
        if (!commands?.find(cmd => cmd.name === args[1])) {
            console.log(colors.red(`Unknown command: ${args[1]}!`) + colors.gray(` Use ${colors.yellow('help')} to see a list of avalible commands.`));
            return;
        }
        return logHelpFor(commands?.find(cmd => cmd.name === args[1]) as Command);
    }

    let hMsg = [
        colors.white('USAGE:'),
        command('help', 'Show this help message.', longestNamedCommand),
        ...commands?.map(cmd => command(cmd.name, cmd.description, longestNamedCommand)) ?? [],
        // inject help message
    ]

    for (let msg of hMsg) {
        console.log(msg);
    }
}

function command(name: string, description: string, longestNamedCommand: number) {
    let msg = `   ${colors.green(name)}`.padStart(3).padEnd(longestNamedCommand + 15, ' ');
    msg += colors.gray(description);
    return msg;
}