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
        description: "Enables debug mode",
        alias: "--debug"
    },
    "--debug": {
        name: "debug",
        description: "Enables debug mode",
        hide: true
    },
    "--dout": {
        name: "debugOutput",
        description: "Outputs debug information to a file",
        alias: "--debug-output"
    },
    "--debug-output": {
        name: "debugOutput",
        description: "Outputs debug information to a file",
        hide: true
    },
    "-f": {
        name: "file",
        description: "Runs a Demi file"
    },
    "-t": {
        name: "test",
        description: "Runs tests on a specific file",
        alias: "--test"
    },
    "--test": {
        name: "test",
        description: "Runs tests on a specific file",
        hide: true
    },
    "-tr": {
        name: "testRecursive",
        description: "Runs tests recursively on all .dem files in a directory",
        alias: "--test-recursive"
    },
    "--test-recursive": {
        name: "testRecursive",
        description: "Runs tests recursively on all .dem files in a directory",
        hide: true
    }
}

export const globalSettings: Record<string, boolean|string> = {
    help: false,
    debug: false,
    speed: false,
    verbose: false,
    repl: false,
    file: "",
    debugOutput: "",
    test: false,
    testRecursive: false
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

    // Check if we should run tests on a single file
    if (globalSettings.test && typeof(globalSettings.file) === "string" && globalSettings.file !== "") {
        const filename = globalSettings.file;
        await Deno.stat(filename).catch(() => {
            logger.CustomError("Demi", `File '${filename}' does not exist.`);
            Deno.exit(1);
        });

        const success = await runTest(filename);
        if (!success && !globalSettings.testRecursive) {
            // Only exit with error code if this is a single test and not part of recursive testing
            Deno.exit(1);
        }
    }
    // Check if we should run tests recursively
    else if (globalSettings.testRecursive && typeof(globalSettings.file) === "string" && globalSettings.file !== "") {
        const directoryPath = globalSettings.file;
        await Deno.stat(directoryPath).catch(() => {
            logger.CustomError("Demi", `Directory '${directoryPath}' does not exist.`);
            Deno.exit(1);
        });

        await runTestsRecursively(directoryPath);
        // Never exit with error code after recursive tests - summary will show failures
    }
    // Check if file exists for normal execution
    else if (typeof(globalSettings.file) == "string" && globalSettings.file != "") {
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

/**
 * Run a test on a single Demi file
 * @param filename Path to the Demi file to test
 */
async function runTest(filename: string) {
    // Create a border with the filename
    const filenameShort = filename.split('/').pop() || filename;
    const borderWidth = Math.max(filenameShort.length + 12, 60);
    const topBorder = `┏${"━".repeat(borderWidth)}┓`;
    const bottomBorder = `┗${"━".repeat(borderWidth)}┛`;
    const titleBar = `┃ 🧪 Test: ${filenameShort} ${"".padEnd(borderWidth - filenameShort.length - 10)}┃`;
    
    console.log(topBorder);
    console.log(titleBar);
    console.log(`┣${"━".repeat(borderWidth)}┫`);
    
    // Output buffer to collect all messages
    const outputLines: string[] = [];
    const addToOutput = (line: string) => {
        const lines = line.split('\n');
        for (const l of lines) {
            outputLines.push(`┃ ${l.padEnd(borderWidth - 2)}┃`);
        }
    };
    
    let success = false;
    try {
        // Read the file
        let input: string;
        try {
            input = await Deno.readTextFile(filename);
        } catch (err) {
            addToOutput(`❌ Could not read file: ${filename}`);
            addToOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
            success = false;
        }
        
        if (input !== undefined) {
            // Parse the file
            const start = performance.now();
            const parser = new Parser();
            let program;
            
            try {
                program = parser.produceAST(input);
                addToOutput(`✓ Parsed successfully`);
            } catch (err) {
                addToOutput(`❌ Parsing failed`);
                addToOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
                success = false;
            }
            
            // Evaluate the program if parsing succeeded
            if (program) {
                try {
                    // Capture console output
                    const originalConsoleLog = console.log;
                    console.log = (...args: any[]) => {
                        addToOutput(args.join(' '));
                    };
                    
                    const env = createGlobalEnv();
                    const result = evaluate(program, env);
                    const end = performance.now();
                    
                    // Restore original console.log
                    console.log = originalConsoleLog;
                    
                    addToOutput(`✓ Executed successfully (${(end - start).toFixed(2)}ms)`);
                    if (globalSettings.verbose) {
                        addToOutput(`Result: ${JSON.stringify(result)}`);
                    }
                    
                    success = true;
                } catch (err) {
                    addToOutput(`❌ Execution failed`);
                    addToOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
                    success = false;
                }
            }
        }
    } catch (error) {
        // Catch any other unexpected errors
        addToOutput(`❌ Test failed (unexpected error)`);
        addToOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
        success = false;
    }
    
    // Print output
    outputLines.forEach(line => console.log(line));
    
    // Print status line
    console.log(`┣${"━".repeat(borderWidth)}┫`);
    const statusText = success ? "✅ PASSED" : "❌ FAILED";
    console.log(`┃ ${statusText.padEnd(borderWidth - 2)}┃`);
    console.log(bottomBorder);
    console.log(""); // Empty line after each test
    
    return success;
}
}

/**
 * Run tests recursively on all .dem files in a directory
 * @param directoryPath Path to the directory containing .dem files
 */
async function runTestsRecursively(directoryPath: string) {
    // Create a border for the directory header
    const headerWidth = Math.max(directoryPath.length + 30, 80);
    const headerTopBorder = `┏${"━".repeat(headerWidth)}┓`;
    const headerBottomBorder = `┗${"━".repeat(headerWidth)}┛`;
    
    console.log(headerTopBorder);
    console.log(`┃ 🧪 Running Tests in Directory: ${directoryPath.padEnd(headerWidth - 33)}┃`);
    console.log(`┗${"━".repeat(headerWidth)}┛`);
    console.log(); // Add a blank line after header
    
    let passedTests = 0;
    let failedTests = 0;
    
    async function processDirectory(dirPath: string) {
        for await (const entry of Deno.readDir(dirPath)) {
            const entryPath = `${dirPath}/${entry.name}`;
            
            if (entry.isDirectory) {
                await processDirectory(entryPath);
            } else if (entry.isFile && entry.name.endsWith('.dem')) {
                const success = await runTest(entryPath);
                if (success) {
                    passedTests++;
                } else {
                    failedTests++;
                }
                // Note: runTest already adds a blank line after each test
            }
        }
    }
    
    await processDirectory(directoryPath);
    
    // Create a nice summary border
    const summaryWidth = 60;
    const summaryTopBorder = `┏${"━".repeat(summaryWidth)}┓`;
    const summaryBottomBorder = `┗${"━".repeat(summaryWidth)}┛`;
    
    console.log(summaryTopBorder);
    console.log(`┃ 📊 Test Summary ${"".padEnd(summaryWidth - 16)}┃`);
    console.log(`┣${"━".repeat(summaryWidth)}┫`);
    console.log(`┃ ✅ Tests passed: ${passedTests.toString().padEnd(summaryWidth - 17)}┃`);
    console.log(`┃ ❌ Tests failed: ${failedTests.toString().padEnd(summaryWidth - 17)}┃`);
    console.log(`┣${"━".repeat(summaryWidth)}┫`);
    console.log(`┃ 🔢 Total tests: ${(passedTests + failedTests).toString().padEnd(summaryWidth - 17)}┃`);
    console.log(summaryBottomBorder);
}
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

    // Define format
    const format = [
        {name: "help", shortFlag: "-h", longFlag: "--help", description: "Shows the help menu"},
        {name: "repl", shortFlag: "-r", longFlag: "", description: "Starts up a Demi repl environment"},
        {name: "speed", shortFlag: "-s", longFlag: "", description: "Displays the speed of the application after it has been run"},
        {name: "verbose", shortFlag: "-v", longFlag: "", description: "Produces more verbose information"},
        {name: "debug", shortFlag: "-d", longFlag: "--debug", description: "Enables debug mode"},
        {name: "debugOutput", shortFlag: "--dout", longFlag: "--debug-output", description: "Outputs debug information to a file"},
        {name: "file", shortFlag: "-f", longFlag: "", description: "Runs a Demi file"},
        {name: "test", shortFlag: "-t", longFlag: "--test", description: "Runs tests on a specific file"},
        {name: "testRecursive", shortFlag: "-tr", longFlag: "--test-recursive", description: "Runs tests recursively on all .dem files in a directory"}
    ];

    // Column widths
    const nameWidth = 12;
    const shortFlagWidth = 10;
    const longFlagWidth = 30; // Increased to accommodate longer flags
    
    // Create rows
    const rows: string[][] = [];
    for (const item of format) {
        let commandInfo = `   ${item.name.padEnd(nameWidth)}`;
        commandInfo += item.shortFlag.padEnd(shortFlagWidth);
        commandInfo += item.longFlag.padEnd(longFlagWidth);
        rows.push([commandInfo, "| " + item.description]);
    }
    
    // Print the rows with consistent spacing
    const maxCommandWidth = Math.max(...rows.map(row => row[0].length)) + 3;
    for (const row of rows) {
        const padding = " ".repeat(maxCommandWidth - row[0].length);
        console.log(row[0] + padding + row[1]);
    }
}

// Check if speed is enabled
if (globalSettings.speed) {
    console.timeEnd("Execution time");
}