declare module 'util' {
    export function promisify<T extends (...args: any[]) => any>(fn: T): (...args: any[]) => Promise<any>;
}
