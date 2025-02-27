import { logger, maths } from "../../helpers/helpers.ts";
import Environment from "../environment.ts";
import { ArrayVal, MK_NUMBER, MK_STRING, NumberVal, StringVal, FunctionVal } from "../values.ts";
import { MK_NATIVE_FN, MK_NULL } from "../values.ts";

export function SetupStdioFunctions(env: Environment) {
    // print()
    env.declareVar("print", MK_NATIVE_FN((args, _scope) => {
        logger.Debug("=== Print Function Start ===");
        logger.Debug(`Arguments count: ${args.length}`);
        logger.Debug(`Raw args:`, JSON.stringify(args, null, 2));
        let outstring = "";

        if (args.length == 0) {
            logger.Debug("No arguments, printing empty line");
            console.log("");
        } else if (args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                logger.Debug(`Processing arg ${i}:`, JSON.stringify(args[i], null, 2));
                logger.Debug(`Argument type: ${args[i].type}`);
                logger.Debug(`Argument value: ${args[i].value}`);
                
                if (args[i].type == "array") {
                    const arr = [];
                    for (const element in (args[i] as ArrayVal).value) {
                        arr.push((args[i] as ArrayVal).value[element].value);
                    }
                    outstring += `[ ${arr.join(", ")} ]`;
                } else if (args[i].type == "function") {
                    const funcValue = args[i] as FunctionVal;
                    const params = funcValue && 'params' in funcValue ? funcValue.params : [];
                    outstring += `<function ${funcValue.identifier || 'anonymous'}, params(${params.join(", ")})>`;
                } else if (args[i].type == "string") {
                    logger.Debug(`Adding value to outstring: "${args[i].value}"`);
                    outstring += args[i].value;
                } else {
                    logger.Debug(`Unknown type ${args[1].type}, trying to use value`);
                    outstring += args[i].value?.toString() ?? "";
                }
                logger.Debug(`Current outstring: "${outstring}"`);
            }

            logger.Debug(`Final outstring: "${outstring}"`);
            console.log(outstring);
        }

        logger.Debug("=== Print Function End ===");
        return MK_NULL();
    }), true);

    // input()
    env.declareVar("input", MK_NATIVE_FN((args, _scope) => {
        if (args.length < 1) return MK_STRING(prompt() as string);
        else if (args.length == 1 && args[0].type == "string") return MK_STRING(prompt(`${args[0].value}`) as string);
        else return MK_STRING("");
    }), true)

    // to_string()
    env.declareVar("to_string", MK_NATIVE_FN((args, _scope) => {
        if (args.length != 1) {
            logger.RuntimeError("(to_string) Expected only 1 argument, found", args.length)
            Deno.exit(1);
        } else {
            if (args[0].value != null || args[0].value != undefined)
                return MK_STRING(args[0].value.toString());
            else return MK_STRING("")
        }
    }), true)

    // to_number()
    env.declareVar("to_number", MK_NATIVE_FN((args, _scope) => {
        if (args.length != 1) {
            logger.RuntimeError("(to_number) Expected only 1 argument, found", args.length)
            Deno.exit(1);
        } else {
            if (args[0].value != null || args[0].value != undefined) {
                if (args[0].type == "number") return MK_NUMBER((args[0] as NumberVal).value);
                else if (args[0].type == "string") {
                    const str = (args[0] as StringVal).value;
                    if (maths.isint(str)) return MK_NUMBER(parseInt(str));
                    else return MK_NUMBER(0);
                } else {
                    logger.RuntimeError("(to_number) Expects an argument of type string or number");
                    Deno.exit(1);
                }
            }
            else return MK_NUMBER(0)
        }
    }), true)
}