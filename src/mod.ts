#!/usr/bin/env node
import {run} from "./cli/mod.js";
import {commands} from './commands/mod.js';
import * as expect from './libs/expect.js';
import esMain from 'es-main';

expect.init();

// yucky patch to disable warnings
const originalEmit = process.emit;
// @ts-ignore
process.emit = function (name : any, data : any, ...args : any[]) {
    if (name === `warning` && typeof data === `object` && data.name === `ExperimentalWarning`
    // if you want to only stop certain messages, test for the message here:
    // && data.message.includes(`Fetch API`)
    ) {
        return false;
    }
    // @ts-ignore
    return originalEmit.apply(process, args);
};


if (esMain(import.meta)) {
    run(commands);
} else {
    console.log("This module is not intended to be imported.");
}
