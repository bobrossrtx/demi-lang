import { Stmt } from "../frontend/ast.ts";
import Environment from "./environment.ts";

export type ValueTypes = 
    | "null" 
    | "number"
    | "boolean"
    | "string"
    | "array"
    | "object"
    | "native-fn"
    | "function"
    | "class";

export interface RuntimeVal {
    type: ValueTypes;
    value?: string | number | boolean | null | FunctionCall | Map<string, RuntimeVal> | Array<RuntimeVal>;
    line: number;
    column: number;
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

export interface ArrayMethods {
    [key: string]: NativeFnVal;
    value: NativeFnVal;
    push: NativeFnVal;
    pop: NativeFnVal;
    length: NativeFnVal;
    includes: NativeFnVal;
    indexOf: NativeFnVal;
    join: NativeFnVal;
    slice: NativeFnVal;
    concat: NativeFnVal;
    reverse: NativeFnVal;
    shift: NativeFnVal;
    unshift: NativeFnVal;
    filter: NativeFnVal;
}

export interface ArrayVal extends RuntimeVal {
    type: "array";
    value: RuntimeVal[];
    methods: ArrayMethods;
}

export interface ObjectVal extends RuntimeVal {
    type: "object";
    properties: Map<string, RuntimeVal>;
    scope?: Environment;
    parentEnv?: Environment;
}

export type FunctionCall = (
    args: RuntimeVal[],
    env: Environment,
    line: number,
    column: number
) => RuntimeVal;

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

export function valueToString(val: RuntimeVal): string {
    if (!val) return "";
    
    switch (val.type) {
        case "number":
        case "boolean":
            return val.value?.toString() ?? "";
        case "string":
            return val.value?.toString() ?? "";
            case "array": {
                const arrayVal = val as ArrayVal;
                if (!arrayVal.value) return "[]";
                
                // Map array values to strings
                const values = arrayVal.value.map(item => {
                    switch (item.type) {
                        case "string":
                            return `"${item.value}"`;
                        case "array":
                            return valueToString(item); // Recursive for nested arrays
                        case "null":
                            return "null";
                        default:
                            return item.value?.toString() ?? "";
                    }
                });
                
                return `[${values.join(", ")}]`;
            }
        case "null":
            return "null";
        case "object": {
            // Cast to ObjectVal first to access properties
            const objVal = val as ObjectVal;
            if (!objVal.properties) return "{}";
            
            const entries = Array.from(objVal.properties.entries())
                .map(([key, value]) => `${key}: ${valueToString(value)}`);
            return `{${entries.join(", ")}}`;
        }
        case "function": {
            const funcVal = val as FunctionVal;
            return `<function ${funcVal.identifier || 'anonymous'}>`;
        }
        case "native-fn":
            return "<native function>";
        default:
            return val.value?.toString() ?? "";
    }
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
    // Parse escape chars
    // const value = value.split("");
    let output = "";
    if (value) {
        for (let idx = 0; idx < value.length; idx++) {
            const regex = /(\\)\w+/g;
            if (regex.test(value[idx]+value[idx+1])) {
                switch (value[idx+1]) {
                    case 'n': output += '\n'; break;
                    case 't': output += '\t'; break;
                    case 'b': output += '\b'; break;
                    case 'r': output += '\r'; break;
                    case 'v': output += '\n\t'; break;
                    default: output += value[idx+1]; break;
                }
                idx += 1;
            } else output += value[idx]
        }
    }

    // value.replace(/[\\].[n]/g, "\n")
    return { type: "string", value: output } as StringVal;
}

export function MK_OBJECT(properties: Map<string, RuntimeVal>): RuntimeVal {
    return { type: "object", properties } as ObjectVal;
}

export function MK_NATIVE_FN(call: FunctionCall): RuntimeVal {
    return { type: "native-fn", call } as NativeFnVal;
}

export function MK_ARRAY(values: RuntimeVal[], line = 0, column = 0): ArrayVal {
    const methods: ArrayMethods = {
        value: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                if (args.length!== 1) {
                    throw "Array value method requires one argument";
                }
                const index = Number(args[0].value);
                if (index < 0 || index >= values.length) {
                    throw "Index out of bounds";
                }
                return values[index];
            },
            line,
            column
        },
        push: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                if (args.length !== 1) {
                    throw "Array push method requires one argument";
                }
                values.push(args[0]);
                return MK_NULL();
            },
            line,
            column
        },
        pop: {
            type: "native-fn",
            call: (_args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                if (values.length === 0) {
                    throw "Cannot pop from empty array";
                }
                return values.pop() || MK_NULL();
            },
            line,
            column
        },
        length: {
            type: "native-fn",
            call: (_args: RuntimeVal[], _env: Environment, _line: number, _column: number) => 
                MK_NUMBER(values.length),
            line,
            column
        },
        includes: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                if (args.length !== 1) {
                    throw "Array includes method requires one argument";
                }
                const target = args[0];
                return MK_BOOL(values.some(item => 
                    item.type === target.type && item.value === target.value
                ));
            },
            line,
            column
        },
        indexOf: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                if (args.length !== 1) {
                    throw "Array indexOf method requires one argument";
                }
                const target = args[0];
                return MK_NUMBER(values.findIndex(item => 
                    item.type === target.type && item.value === target.value
                ));
            },
            line,
            column
        },
        join: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                const separator = args.length > 0 ? valueToString(args[0]) : ",";
                return MK_STRING(values.map(v => valueToString(v)).join(separator));
            },
            line,
            column
        },
        slice: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, line: number, column: number) => {
                const start = args[0]? Number(args[0].value) : 0;
                const end = args[1]? Number(args[1].value) : values.length;
                return MK_ARRAY(values.slice(start, end), line, column);
            },
            line,
            column
        },
        concat: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, line: number, column: number) => {
                if (args.length!== 1) {
                    throw "Array concat method requires one argument";
                }
                const otherArray = args[0] as ArrayVal;
                return MK_ARRAY(values.concat(otherArray.value), line, column);
            },
            line,
            column
        },
        reverse: {
            type: "native-fn",
            call: (_args: RuntimeVal[], _env: Environment, line: number, column: number) => 
                MK_ARRAY(values.slice().reverse(), line, column),
            line,
            column
        },
        shift: {
            type: "native-fn",
            call: (_args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                if (values.length === 0) {
                    throw "Cannot shift from empty array";
                }
                return values.shift() || MK_NULL();
            },
            line,
            column
        },
        unshift: {
            type: "native-fn",
            call: (args: RuntimeVal[], _env: Environment, _line: number, _column: number) => {
                values.unshift(...args);
                return MK_NUMBER(values.length);
            },
            line,
            column
        },
        filter: {
            type: "native-fn",
            call: (args: RuntimeVal[], env: Environment, line: number, column: number) => {
                if (args.length !== 1) {
                    throw "Array filter method requires one argument";
                }
                const callback = args[0] as NativeFnVal;
                return MK_ARRAY(values.filter(item => {
                    const result = callback.call([item], env, line, column);
                    return result.type === "boolean" && result.value;
                }), line, column);
            },
            line,
            column
        }
    } as const;

    return {
        type: "array",
        value: values,
        methods,
        line,
        column
    };
}