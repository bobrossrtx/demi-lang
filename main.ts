import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

const parameters: Record<string, string> = {
    "-d": "debug",
    "-s": "speed",
    "-v": "verbose",
    "-r": "repl",
}

// deno-lint-ignore prefer-const
let globalSettings: Record<string, boolean|string> = {
    debug: false,
    speed: false,
    verbose: false,
    repl: false,
    file: ""
}

if (Deno.args.length == 0) {
    repl();
} else {
    // Loop through all args and check if they are files, else add them the the programs parameter list
    for (let i = 0; i < Deno.args.length; i++) {
        const arg = Deno.args[i];
        if (arg.startsWith("-")) {
            const setting = parameters[arg];
            if (setting) {
                globalSettings[setting] = true;
            } else {
                console.error(`Unknown parameter '${arg}'`);
                Deno.exit(1);
            }
        } else {
            globalSettings.file = arg;
        }
    }

    // Check if debug is enabled
    if (globalSettings.debug) {
        console.log("Debug mode enabled");
    }

    // Check if verbose is enabled
    if (globalSettings.verbose) {
        console.log("Verbose mode enabled");
    }

    // Check if repl is enabled
    if (globalSettings.file == "" || globalSettings.repl) {
        repl();
    }

    // Check if speed is enabled
    if (globalSettings.speed) {
        console.time("Execution time");
    }

    // Check if file exists
    if (typeof(globalSettings.file) == "string" && globalSettings.file != "") {
        const filename = globalSettings.file;
        await Deno.stat(filename).catch(() => {
            console.error(`File '${filename}' does not exist.`);
            Deno.exit(1);
        });

        run(filename);
    }
}


async function run(filename: string) {
    const parser = new Parser();
    const env = createGlobalEnv();

    const input = await Deno.readTextFile(filename);
    const program = parser.produceAST(input);
    
    // const result = evaluate(program, env);
    evaluate(program, env);
}

function repl() {
    const parser = new Parser();
    const env = createGlobalEnv();

    console.log("DemiScript v0.1")
    console.log("Repl v0.1");

    while (true) {
        const input = (prompt("> ") as string);

        const program = parser.produceAST(input);
        
        // const result = evaluate(program, env);
        evaluate(program, env);
    }
}

// Check if speed is enabled
if (globalSettings.speed) {
    console.timeEnd("Execution time");
}