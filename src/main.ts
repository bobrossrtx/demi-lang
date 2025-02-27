import Config from "./config.ts";
import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";
import { logger } from "./helpers/helpers.ts";

interface Parameter {
    name: string,
    description: string,
    hide?: boolean
    alias?: string
}

const parameters: Record<string, Parameter> = {
    "-h": {
        name: "help",
        description: "Shows the help menu",
        alias: "--help"
    },
    "--help": {
        name: "help",
        description: "Shows the help menu",
        hide: true
    },
    "-r": {
        name: "repl",
        description: "Starts up a Demi repl environment"
    },
    "-s": {
        name: "speed",
        description: "Displays the speed of the application after it has been run"
    },
    "-v": {
        name: "verbose",
        description: "Produces more verbose information"
    },
    "-d": {
        name: "debug",
        description: "Enables debug mode"
    }
}

// deno-lint-ignore prefer-const
export const globalSettings: Record<string, boolean|string> = {
    help: false,
    debug: false,
    speed: false,
    verbose: false,
    repl: false,
    file: ""
}

if (Deno.args.length == 0) {
    displayHelp();
} else {
    // Loop through all args and check if they are files, else add them the the programs parameter list
    for (let i = 0; i < Deno.args.length; i++) {
        const arg = Deno.args[i];
        if (arg.startsWith("-")) {
            const setting = parameters[arg];
            if (setting) {
                globalSettings[setting.name] = true;
            } else {
                logger.CustomError("Demi", `Unknown parameter '${arg}'`);
                Deno.exit(1);
            }
        } else {
            globalSettings.file = arg;
        }
    }

    // Check if the help menu is opened
    if (globalSettings.help) {
        displayHelp();
        Deno.exit(0);
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
            logger.CustomError("Demi", `File '${filename}' does not exist.`);
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

    evaluate(program, env);
}

function repl() {
    const parser = new Parser();
    const env = createGlobalEnv();

    console.log(`DemiScript v${Config.version}`)
    console.log("Repl v0.1");

    while (true) {
        const input = (prompt("> ") as string);
        const program = parser.produceAST(input);
        evaluate(program, env);
    }
}

function displayHelp() {
    console.log(`DemiScript v${Config.version}\n`)

    console.log("Usage: demi.exe [options] [file]\n")

    console.log("Website : https://demi-website.fly.dev")
    console.log("Github  : https://github.com/bobrossrtx/demi-lang")
    console.log("Issues  : https://github.com/bobrossrtx/demi-lang/issues")

    console.log("\nCommands:")
    for (const parameter in parameters) {
        if (!parameters[parameter].hide)
            console.log(`   ${parameters[parameter].name}`+(" ").repeat(10-parameters[parameter].name.length)+(parameters[parameter]?.alias ? parameters[parameter]?.alias : (" ").repeat(6))+" "+parameter+(" ").repeat(3)+"| "+parameters[parameter].description);
    }
}

// Check if speed is enabled
if (globalSettings.speed) {
    console.timeEnd("Execution time");
}