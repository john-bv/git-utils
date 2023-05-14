// This is a module that extends functionality of internal implementation of error catching.import fs from 'fs';
import fs from 'fs';

export function init() {
    globalThis.Error.prototype.expect = function(message: string, display: boolean=false) {
        if (display) {
            const stack = this.stack || "";
            let file = stack.split('\n')[1].split(' ')[5];
            const f = fs.readFileSync(file.replace('file://', '').split(':')[0], 'utf-8');
            // replace everything before the base path with a .
            file = file
                .replace(process.cwd(), '.')
                .replace('file://', '');
            // @ts-ignore
            let line: number = /:(\d+):/.exec(this.stack.split('\n')[1])[1] || 0;
            // @ts-ignore
            let column: number = /:(?:\d+):(\d+)/.exec(this.stack.split('\n')[1])[1] || 0;

            file = file.replace(`:${line}:${column}`, '');

            // get the actual code that caused the crash
            // get the line number from the file
            const lineOfCode = f.split('\n')[line - 1];

            const msg = `process panicked!\n`
                + `---> ${file}:${line}:${column}\n`
                +  ` ${line} | ${lineOfCode}\n`
                +  ` ${' '.repeat(lineOfCode.length)} | ${' '.repeat(column - 1)}^\n`
                +  `  ${' '.repeat(lineOfCode.length)}\\_${'_'.repeat(column - 1)} ${this.message}\n`
            console.log(msg);
            process.exit(1);
        } else {
            console.log(message);
            process.exit(0);
        }
    }

    // @ts-ignore
    globalThis.Promise.prototype.expect = function(message: string) {
        this.catch((e) => {
            e.expect(message);
        });
        return new Promise((resolve, reject) => {
            this.then(resolve);
        });
    }
}

/**
 * A wrapper function around things that can error, and will call expect
 * if it does error.
 */
export function expect(fn: (...args: any) => any, message: string, display: boolean=false) {
    try {
        fn();
    } catch (e: any) {
        e.expect(message);
    }
}