// deno-lint-ignore-file no-explicit-any

import { globalSettings } from "../main.ts";

export default class Logger {
    /// GENERAL
    public Debug(...args: any[]) {
        if (!globalSettings.debug) return;

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

    public AssertionError(...args: any[]) {
        let outString = "";
        for (let i = 0; i < args.length; i++)
            outString += args[i];

        console.log(`\x1B[1m\x1B[31mAssert Error: \x1B[0m`+outString);
        Deno.exit(1);
    }

    public AST(node: any, prefix: string = "") {
        if (!globalSettings.debug) return;
        
        const filteredNode = this.filterASTNode(node);
        console.log(`\n=== AST Node: ${prefix} ===`);
        console.log("Kind:", node.kind);
        console.log("Location:", `Line ${node.line}, Column ${node.column}`);
        console.log("Structure:", JSON.stringify(filteredNode, null, 2));
        console.log("===================\n");
    }

    private filterASTNode(node: any): any {
        if (!node) return null;
        
        // Deep clone to avoid modifying original
        const filtered = { ...node };
        
        // Remove circular references and verbose properties
        delete filtered.parent;
        delete filtered.scope;
        
        // Recursively filter child nodes
        for (const key in filtered) {
            if (typeof filtered[key] === 'object') {
                filtered[key] = this.filterASTNode(filtered[key]);
            }
        }
        
        return filtered;
    }
}