import Environment from "../environment.ts";
import { MK_NATIVE_FN, MK_NULL } from "../values.ts";

export function SetupStdioFunctions(env: Environment) {
    // print()
    env.declareVar("print", MK_NATIVE_FN((args, _scope) => {
        // console.log(args[0]?.value);
        switch (args[0]?.type) {
            case "number":
                console.log(args[0]?.value);
                break;
            case "string":
                console.log(args[0]?.value);
                break;
            case "boolean":
                console.log(args[0]?.value);
                break;
            case "null":
                console.log(args[0]?.value);
                break;
            case "object":
                console.log(JSON.stringify(args[0]));
                break;
            case "function":
                console.log(args[0]?.value);
                break;
            case "native-fn":
                console.log(args[0]?.value);
                break;
            default:
                console.log(args[0]?.value);
                break;
        }
        return MK_NULL();
    }), true);

}