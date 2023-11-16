import { logger } from "../../helpers/helpers.ts";
import Environment from "../environment.ts";
import { MK_NATIVE_FN, MK_NULL, MK_OBJECT, NumberVal } from "../values.ts";
import { SetupMathFunctions } from "./math.ts";
import { SetupStdioFunctions } from "./stdio.ts";
import { SetupTimeFunctions } from "./time.ts";

export function SetupStdlibFunctions(env: Environment) {
    SetupStdioFunctions(env);
    SetupMathFunctions(env);
    SetupTimeFunctions(env);

    /* TODO (default imports added to global scope here??)
     *  - Any stdlib methods or vars that are defined in a .dem file can be
     *    evaluated here and added to the global scope
    */

    env.declareVar("assert", MK_NATIVE_FN((args, _scope) => {
        if (args.length < 1)
            logger.AssertionError(`assert() expects at least 1 argument, got ${args.length}`); // | ${args[0].line}:${args[0].column}`);
        
        let customErrorMessage = false;
        if (args.length == 2) customErrorMessage = true;

        if (args[0]?.type != "boolean")
            logger.AssertionError(`assert() expects argument 1 to be a boolean, got ${args[0]?.type} | ${args[0]?.line}:${args[0]?.column}`);

        if (!args[0]?.value)
            if (customErrorMessage) logger.AssertionError(args[1].value);
            else logger.AssertionError(`Assertion failed.`);

        return MK_NULL();
    }), true);

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

    env.declareVar("get_globals", MK_NATIVE_FN((_args, _scope) => {
        const obj = MK_OBJECT(env.variables);
        return obj;
    }), true);
}