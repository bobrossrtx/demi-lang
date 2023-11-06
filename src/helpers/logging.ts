// deno-lint-ignore-file no-explicit-any
export default class Logger {
    /// GENERAL
    public Debug(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[33mDebug: \x1B[0m"+outString);
    }

    public Info(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[36mInfo: \x1B[0m"+outString);
    }

    /// ERROR MESSAGES
    public RuntimeError(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[31mRuntime Error: \x1B[0m"+outString);
    }

    public RuntimeException(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[31mRuntime Exception: \x1B[0m"+outString);
        this.Info("Exceptions can be handled with try catch statements (future update).")
    }

    public SyntaxError(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[31mSyntax Error: \x1B[0m"+outString);
    }

    public ParserError(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[31mParser Error: \x1B[0m"+outString);
    }

    public CustomError(customErrorIdentifier: string, ...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log("\x1B[1m\x1B[31m"+customErrorIdentifier+" Error: \x1B[0m"+outString);
    }
}