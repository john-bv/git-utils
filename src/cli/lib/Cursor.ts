export class Cursor<T> {
    #intital: number;
    #buffer: T[];
    #index: number;
    #prev: T | null;

    public constructor(buffer: T[]) {
        this.#index = 0;
        this.#intital = buffer.length;
        this.#buffer = buffer;
        this.#prev = null;
    }

    public peek() {
        const idx = this.#buffer.shift();

        if (idx === undefined) {
            return null;
        }

        this.#index++;
        this.#prev = idx;
        return idx;
    }

    public unpeek() {
        if (this.#prev === null) {
            return;
        }

        this.#buffer.unshift(this.#prev);
        this.#index--;
        this.#prev = null;
    }

    public skipTo(idx: number) {
        this.#index = idx;
        this.#buffer = this.#buffer.slice(idx);
        this.#prev = null;
    }

    public get last(): T {
        return this.#buffer[this.#buffer.length - 1];
    }

    public isEof() {
        return this.#buffer.length === 0;
    }

    public get first(): T {
        return this.#buffer[0];
    }

    public get second(): T {
        return this.#buffer[1];
    }

    public nth(n: number): T | undefined {
        return this.#buffer[n];
    }

    public peekN(n: number) {
        for (let i = 0; i < n; i++) {
            if (this.peek() === null) {
                return null;
            }
        }
    }

    public eatWhile(predicate: (char: T) => boolean): T[] {
        let segment: T[] = [];
        while (predicate(this.first)) {
            let idx = this.peek();
            if (idx === null) {
                break;
            }
            segment.push();
        }
        return segment;
    }

    public get eaten(): number {
        return this.#intital - this.#buffer.length;
    }

    public get remaining(): number {
        return this.#buffer.length;
    }
}