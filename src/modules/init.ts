import * as dotenv from "dotenv";
import * as _ from '../libs/expect.js';
import { Octokit } from "octokit";
import colors from 'colors';

dotenv.config();

export const client = new Octokit({ auth: process.env.TOKEN });

export function getArgs() {
    return process.argv.slice(2);
}

// Gets the argument, if if fails, it will fail with a message.
export function getArg(i: number, name=null, required=true) {
    const arg = getArgs()[i];
    if (!arg && required) {
        console.log(colors.red(`Missing argument: ${name ? name : i}, which is required.`));
        process.exit(0);
    }
    return arg;
}