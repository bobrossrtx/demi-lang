import { logger } from "../helpers/helpers.ts";
import { SetupStdlibFunctions } from "./stdlib/stdlib.ts";
import { MK_BOOL, MK_NULL, RuntimeVal } from "./values.ts";

export function createGlobalEnv(): Environment {
    const env = new Environment();

    // Declare global variables
    env.declareVar("true",  MK_BOOL(true),  true);
    env.declareVar("false", MK_BOOL(false), true);
    env.declareVar("null",  MK_NULL(),      true);

    // Declare global functions
    SetupStdlibFunctions(env);

    return env;
}

// function createDisposableEnv(): Environment {
//     const env = new Environment();
//     return env;
// }

export default class Environment {
    public parent?: Environment;
    public variables: Map<string, RuntimeVal>;
    private constants: Set<string>;

    constructor(parentENV?: Environment) {
        this.parent = parentENV;
        this.variables = new Map<string, RuntimeVal>();
        this.constants = new Set<string>();
    }

    public declareVar(varname: string, value: RuntimeVal, constant: boolean): RuntimeVal {
        if (this.variables.has(varname)) {
            logger.RuntimeError(`Cannot declare variable ${varname}. It already exists in this scope.`);
            Deno.exit(1);
        }
        this.variables.set(varname, value);

        if (constant)
            this.constants.add(varname);

        return value;
    }

    public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname);
        if (env.constants.has(varname)) {
            logger.RuntimeError(`Cannot assign value to ${varname} as it is a constant.`);
            Deno.exit(1);
        }

        env.variables.set(varname, value);
        return value;
    }

    // public lookupVar(varname: string, customEnv: any = null): RuntimeVal {
    public lookupVar(varname: string): RuntimeVal {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeVal;
    }

    public resolve(varname: string): Environment {
        if (this.variables.has(varname))
            return this;
        if (this.parent)
            return this.parent.resolve(varname);
        logger.RuntimeError(`Cannot resolve variable ${varname}. It does not exist in this scope.`);
        Deno.exit(1);
    }
}