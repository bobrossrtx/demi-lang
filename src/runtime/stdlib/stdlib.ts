import Environment from "../environment.ts";
import { MK_NATIVE_FN, MK_OBJECT, NumberVal } from "../values.ts";
import { SetupMathFunctions } from "./math.ts";
import { SetupStdioFunctions } from "./stdio.ts";
import { SetupTimeFunctions } from "./time.ts";

export function SetupStdlibFunctions(env: Environment) {
    SetupStdioFunctions(env);
    SetupMathFunctions(env);
    SetupTimeFunctions(env);

    // TODO: uncomment when comparison operators are implemented
    // env.declareVar("assert", MK_NATIVE_FN((args, _scope) => {
    //     if (args.length != 1)
    //         throw `assert() expects 1 argument, got ${args.length}.`;

    //     if (args[0].type != "boolean")
    //         throw `assert() expects argument 1 to be a boolean, got ${args[0].type}.`;

    //     if (!args[0].value)
    //         throw `Assertion failed.`;

    //     return MK_NULL();
    // }), true);

    env.declareVar("exit", MK_NATIVE_FN((args, _scope) => {
        // If no arguments, exit with code 0
        if (args.length == 0)
            Deno.exit(0);
        else if (args.length == 1) {
            if (args[0].type != "number")
                throw `exit() expects argument 1 to be a number, got ${args[0].type}.`;

            const code = (args[0] as NumberVal).value;
            Deno.exit(code);
        }
        else
            throw `exit() expects 0 or 1 arguments, got ${args.length}.`;
    }), true);

    // env.declareVar("panic", MK_NATIVE_FN((args, _scope) => {

    env.declareVar("get_globals", MK_NATIVE_FN((args, _scope) => {
        // return MK_OBJECT(env.variables);
        let obj = MK_OBJECT(env.variables);
        return obj;
    }), true);
}