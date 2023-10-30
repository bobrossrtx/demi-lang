import { Stmt } from "../frontend/ast.ts";
import Environment from "./environment.ts";

export type ValueTypes = 
    | "null" 
    | "number"
    | "boolean"
    | "string"
    | "object"
    | "native-fn"
    | "function"
    | "class";

export interface RuntimeVal {
    type: ValueTypes;
    value?: string | number | boolean | null | FunctionCall | Map<string, RuntimeVal>;
}

export interface NullVal extends RuntimeVal {
    type: "null";
    value: null;
}

export interface NumberVal extends RuntimeVal {
    type: "number";
    value: number;
}

export interface BooleanVal extends RuntimeVal {
    type: "boolean";
    value: boolean;
}

export interface StringVal extends RuntimeVal {
    type: "string";
    value: string;
}

export interface ObjectVal extends RuntimeVal {
    type: "object";
    properties: Map<string, RuntimeVal>;
    scope?: Environment;
    parentEnv?: Environment;
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;
export interface NativeFnVal extends RuntimeVal {
    type: "native-fn";
    call: FunctionCall;
}

export interface FunctionVal extends RuntimeVal {
    type: "function";
    identifier: string;
    params: string[];
    declarationEnv: Environment;
    body: Stmt[];
}

export interface ClassVal extends RuntimeVal {
    type: "class";
    identifier: string;
    constructor: FunctionVal;
    declarationEnv: Environment;
    body: Stmt[];
}

export function MK_NULL(): NullVal {
    return { type: "null", value: null } as NullVal;
}

export function MK_NUMBER(value: number): NumberVal {
    return { type: "number", value } as NumberVal;
}

export function MK_BOOL(value: boolean): RuntimeVal {
    return { type: "boolean", value } as BooleanVal;
}

export function MK_STRING(value: string): RuntimeVal {
    return { type: "string", value } as StringVal;
}

export function MK_OBJECT(properties: Map<string, RuntimeVal>): RuntimeVal {
    return { type: "object", properties } as ObjectVal;
}

export function MK_NATIVE_FN(call: FunctionCall): RuntimeVal {
    return { type: "native-fn", call } as NativeFnVal;
}
