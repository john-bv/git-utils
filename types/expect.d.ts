
export function expect(fn: Function, message: string): void;

declare global {
    interface Error {
        expect(message: string): void;
    }
    interface Promise<T = any> {
        expect(message: string): Promise<T>;
    }
    interface PromiseConstructor {
        expect<T = any>(message: string): Promise<T>;
    }
}