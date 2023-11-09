// deno-lint-ignore-file no-explicit-any
export default class Maths {
    public isint(src: string): boolean {
        return /^[0-9.]+$/.test(src);
    }
}