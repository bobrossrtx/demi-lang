import Environment from "../environment.ts";
import { MK_NATIVE_FN, MK_NULL } from "../values.ts";

export function SetupStdioFunctions(env: Environment) {
    // print()
    env.declareVar("print", MK_NATIVE_FN((args, _scope) => {
        // There are infinite args for print
        let outstring = "";

        if (args.length == 0) console.log("");
        else if (args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                outstring += args[i]?.value
            }

            console.log(outstring);
        }

        return MK_NULL();
    }), true);

}