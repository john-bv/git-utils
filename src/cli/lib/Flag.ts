import { Cursor } from "./Cursor.js";
import colors from "colors";

export enum FlagValue {
    JSON,
    Number,
    String,
    Boolean
}

export interface FlagOptions {
    /**
     * The name of the flag.
     * eg: --send-amount
     */
    name?: string;
    /**
     * The description of the flag.
     */
    description?: string;
    /**
     * An example of how to use this flag. (optional)
     * Examples may use the following variables:
     * - {CMD} - The command name
     * - {FLAG} - The flag name
     * - {COLOR: text} - The text in the specified color
     * @default []
     */
    examples?: string[];
    /**
     * The name of the value that this flag takes.
     * eg: <amount>
     * eg: --send-amount <amount>
     * @default undefined
     */
    param?: string;
    /**
     * The aliases of the flag.
     * eg: -s
     * @default []
     */
    aliases?: string[];
    /**
     * Whether or not this flag is required.
     * @default false
     */
    required?: boolean;
    /**
     * Whether or not to require a value for this flag.
     * @default false
     */
    requiresValue?: boolean;
    /**
     * Set this to a regex expression to validate the value of this flag.
     * eg: /^([0-9]+)$/
     * or use a builtin object like `Number` or `String`
     * eg: Number
     * or use a flag value type like `FlagValue.Number`
     * @default FlagValue.String (no validation)
     */
    value?: any;
}

export class Flag {
    /**
     * The name of this flag.
     */
    public readonly name: string;
    /**
     * The Options for this flag.
     */
    public readonly options: FlagOptions;

    public constructor(name: string, options: FlagOptions = {}) {
        this.name = name;
        const defaultOptions: FlagOptions = {
            name,
            description: 'No description provided.',
            aliases: [],
            required: false,
            requiresValue: false,
            examples: ['No example provided.'],
        };
        options.aliases = options.aliases || [];
        options.name = options.name || name;
        options.description = options.description || defaultOptions.description;
        options.required = options.required || defaultOptions.required;
        options.examples = options.examples || defaultOptions.examples;

        this.options = options;

    }

    // Tries to resolve the usage of this flag into a string.
    public getUsage(): string {
        let usage = '';


        usage += colors.yellow(`--${this.options.name}`);

        if (this.options.param) {
            // if the param is required, add <param> otherwise add [param] also check if the param has a value, otherwise add "any" in place of the value
            usage += colors.gray(` ${this.options.required ? '<' : '['}${this.options.param}${this.options.required ? '>' : ']'}`);
        }

        return usage;
    }

    public tryParseFrom(args: string[]): { value?: any, exists: boolean } {
        const argsList = args.join(' ');

        const namedFlagWithVal = /(--[a-z0-9\S]+)+ ?((?=((\'[\s\S]+\')+)|(\"[\s\S]+\")|(?=([\S]+)))|)/ig;
        // const aliasFlagWithVal = /(-[a-z0-9\S]+)+ ?(?=((\'[\s\S]+\')+)|(\"[\s\S]+\")|([\S]+))/ig;
        const aliasFlagWithVal = /(-[a-z0-9\S]+)+ ?((?=((\'[\s\S]+\')+)|(\"[\s\S]+\")|(?=([\S]+)))|)/ig;
        const namedFlag = /\s--([a-z0-9\S]+)/ig;
        const aliasFlag = /\s-([a-z0-9\S]+)/ig;

        if (namedFlag.test(argsList) === true) {
            const value = this.parseArgValueFlag(argsList, namedFlagWithVal);

            if (value === false) {
                if (this.options.required) {
                    throw new FlagError(this, { missing: true });
                }
                return { exists: false };
            }

            if ((value === true) && this.options.requiresValue)
                throw new FlagError(this, { missingValue: true });

            if (value === true) return { exists: true };

            return { ...this.parseArg(value as string), exists: true };
        }
        if (aliasFlag.test(argsList)) {
            const value = this.parseArgValueFlag(argsList, aliasFlagWithVal);

            if (value === false) {
                if (this.options.required) {
                    throw new FlagError(this, { missing: true });
                }
                return { exists: false };
            }

            if ((value === true) && this.options.requiresValue)
                throw new FlagError(this, { missingValue: true });

            if (value === true) return { exists: true };

            return { ...this.parseArg(value as string), exists: true };
        }

        if (this.options.required) {
            throw new FlagError(this, { missing: true });
        }

        return { exists: false };
    }

    private parseArgValueFlag(argsList: string, matcher: RegExp): string | boolean {
        // check if there is any argument following the flag
        // if there is, then we need to parse the value
        const anyFlag = /^(-[a-z0-9\S]+|--[a-z0-9\S]+)/ig;

        const matches = [...argsList.matchAll(matcher) || []];
        const match = matches.find((groups) => [...this.options.aliases || [], this.options.name].includes(groups[1].replace(/(--|-)/gs, '')));

        if (!match) return false;

        const valueArg = match[2] || match[3] || match[4] || match[5] || match[6] || null;


        if ((valueArg === null) && this.options.requiresValue) {
            throw new FlagError(this, { missingValue: true });
        } else if (valueArg === null) {
            return true;
        }
        if (valueArg[0] === '"' && valueArg[valueArg.length - 1] === '"') {
            return valueArg.slice(1, -1);
        }
        if (valueArg[0] === "'" && valueArg[valueArg.length - 1] === "'") {
            return valueArg.slice(1, -1);
        }
        if (anyFlag.test(valueArg)) {
            throw new FlagError(this, { missingValue: true });
        } else {
            // otherwise, parse the value
            return valueArg;
        }
    }

    /**
     * By default it will parse strings, numbers, booleans, and JSON (within strings).
     * @param arg
     */
    public parseArg(argValue: string): { value: any } {
        let value;
        // check if we can parse the value as JSON
        if (argValue === 'true') value = true;
        if (argValue === 'false') value = false;
        if (Number.isNaN(argValue)) value = parseInt(argValue);

        try {
            value = JSON.parse(argValue);
        } catch {}

        if (this.options.value) {
            if (this.options.value instanceof RegExp) {
                if (!this.options.value.test(argValue)) {
                    throw new FlagError(this, { invalidValue: true }, argValue);
                }
                value = argValue;
            } else if (this.options.value === FlagValue.Number) {
                value = parseInt(argValue) || parseFloat(argValue);

                if (Number.isNaN(value)) {
                    throw new FlagError(this, { invalidValue: true }, value);
                }
            } else if (this.options.value === FlagValue.String) {
                value = argValue.toString();
                if (typeof value !== 'string') {
                    throw new FlagError(this, { invalidValue: true }, value);
                }
            } else if (this.options.value === FlagValue.JSON) {
                if (typeof value !== 'object') {
                    throw new FlagError(this, { invalidValue: true }, value);
                }
            } else {
                value = argValue;
            }

            return { value };
        }

        if (value === undefined) {
            value = argValue;
        }

        return { value };
    }
}

export function getCursor(args: string[]): Cursor<string> {
    const buffer: string[] = args.join(' ').split('');
    return new Cursor(buffer);
}

interface FlagErrorReason {
    /**
     * A flag is missing a value.
     * eg: --flag <value>
     * But <value> is missing, when required.
     */
    missingValue?: boolean;
    /**
     * The flag recieved a value that is invalid.
     * eg: --flag "test"
     * But "test" is invalid, when requiring a number.
     */
    invalidValue?: boolean;
    /**
     * The flag is missing entirely, but required.
     */
    missing?: boolean;
};

export class FlagError extends Error {
    public readonly flag: Flag;
    public readonly value: any;
    public readonly reasons: FlagErrorReason;
    public valueName: string;

    public constructor(flag: Flag, reasons: FlagErrorReason, value?: any) {
        super('FlagError');
        this.flag = flag;
        this.value = value;
        this.reasons = reasons;
        this.valueName = 'unknown';

        if (typeof this.value !== 'undefined') {
            if (typeof this.flag.options.value === 'number') {
                switch (this.flag.options.value) {
                    default:
                        this.valueName = 'unknown';
                        break;
                    case FlagValue.Number:
                        this.valueName = 'number';
                        break;
                    case FlagValue.JSON:
                        this.valueName = 'json';
                        break;
                    case FlagValue.String:
                        this.valueName = 'string';
                        break;
                    case FlagValue.Boolean:
                        this.valueName = 'boolean';
                        break;
                }
            } else {
                this.valueName = 'any';
            }
        }
    }
}