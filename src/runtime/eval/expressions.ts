import Environment from '../environment.ts';
import {
    ArrayLiteral,
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    ComparisonExpr,
    FunctionDeclaration,
    Identifier,
    MemberExpr,
    NumericLiteral,
    ObjectLiteral,
    ReturnStatement,
    StringLiteral,
    TemplateString
    } from '../../frontend/ast.ts';
import {
    valueToString,
    ArrayVal,
    ArrayMethods,
    BooleanVal,
    FunctionVal,
    MK_BOOL,
    MK_NULL,
    MK_NUMBER,
    MK_STRING,
    MK_ARRAY,
    NativeFnVal,
    NumberVal,
    ObjectVal,
    RuntimeVal,
    StringVal
    } from '../values.ts';
import { eval_return_statement } from './statements.ts';
import { evaluate } from '../interpreter.ts';
import { logger } from '../../helpers/helpers.ts';

export function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, binop: BinaryExpr): RuntimeVal {
    let results: number|null = 0;
    
    if (binop.operator == "+") {
        results = lhs.value + rhs.value;
    } else if (binop.operator == "-") {
        results = lhs.value - rhs.value;
    } else if (binop.operator == "*") {
        results = lhs.value * rhs.value;
    } else if (binop.operator == "/") {
        results = lhs.value / rhs.value;
        if (rhs.value == 0) {
            logger.RuntimeException("Divide by zero returns undefined");
            Deno.exit(1)
        }
    } else if (binop.operator == "%") {
        results = lhs.value % rhs.value;
    } else {
        logger.RuntimeError(`Unimplemented operator - ${binop.operator} | ${binop.line}:${binop.column}`);
        Deno.exit(1);
    }

    if (results == null) return MK_NULL();
    return { type: "number", value: results } as NumberVal;
}

export function eval_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);
    
    if (lhs.type == "number" && rhs.type == "number")
        return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop);

    // One or both are NULL
    return MK_NULL();
}

export function eval_comparison_expr(expr: ComparisonExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(expr.left, env);
    const rhs = evaluate(expr.right, env);

    // TODO: Finish off comparrison operators
    if (lhs.type == "number" && rhs.type == "number") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as NumberVal).value == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != (rhs as NumberVal).value);
        else if (expr.operator == ">")
            return MK_BOOL((lhs as NumberVal).value > (rhs as NumberVal).value);
        else if (expr.operator == ">=")
            return MK_BOOL((lhs as NumberVal).value >= (rhs as NumberVal).value);
        else if (expr.operator == "<")
            return MK_BOOL((lhs as NumberVal).value < (rhs as NumberVal).value);
        else if (expr.operator == "<=")
            return MK_BOOL((lhs as NumberVal).value <= (rhs as NumberVal).value);
    } else if (lhs.type == "string" && rhs.type == "string") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as StringVal).value == (rhs as StringVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as StringVal).value != (rhs as StringVal).value);
    } else if (lhs.type == "boolean" && rhs.type == "boolean") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as BooleanVal).value == (rhs as BooleanVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as BooleanVal).value != (rhs as BooleanVal).value);
    } else if (lhs.type == "boolean" && rhs.type == "number") {
        if (expr.operator == "==")
            return MK_BOOL(((lhs as BooleanVal).value ? 1 : 0) == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL(((lhs as BooleanVal).value ? 1 : 0) != (rhs as NumberVal).value);
    } else if (lhs.type == "number" && rhs.type == "boolean") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as NumberVal).value == ((rhs as BooleanVal).value ? 1 : 0));
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != ((rhs as BooleanVal).value ? 1 : 0));
    } else if (lhs.type == "null" && rhs.type == "null") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as NumberVal).value == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != (rhs as NumberVal).value);
    } else if (lhs.type == "object" && rhs.type == "object") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as ObjectVal).properties == (rhs as ObjectVal).properties);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as ObjectVal).properties != (rhs as ObjectVal).properties);
    } else {
        throw `Runtime Error: Unimplemented operator: ${expr.operator}`
    }

    // One or both are NULL
    return MK_BOOL(false);
}

export function eval_identifier(ident: Identifier, env: Environment): RuntimeVal {
    const val = env.lookupVar(ident.symbol);
    return val;
}

export function eval_object_expr(obj: ObjectLiteral, env: Environment): RuntimeVal {
    const objscope = new Environment(env);
    const object = { type: "object", properties: new Map(), objscope, env, line: obj.line, column: obj.column} as ObjectVal;
    for (const {key, value} of obj.properties) {
        const runtimeVal = (value == undefined) ? env.lookupVar(key) : evaluate(value, env);
        object.properties.set(key, runtimeVal);
        objscope.declareVar(key, runtimeVal, false);
    }
    return object;
}

export function eval_array_expr(array: ArrayLiteral, env: Environment): RuntimeVal {
    const elements = array.elements.map((element) => {
        return evaluate(element, env);
    })

    const methods: ArrayMethods = {
        value: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                if (args.length!== 1) {
                    throw "Array value method requires one argument";
                }
                const index = Number(args[0].value);
                if (index < 0 || index >= elements.length) {
                    throw "Index out of bounds";
                }
                return elements[index];
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        push: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                if (args.length !== 1) {
                    throw "Array push method requires one argument";
                }
                elements.push(args[0]);
                return MK_NULL();
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        pop: {
            type: "native-fn",
            call: () => {
                if (elements.length === 0) {
                    throw "Cannot pop from empty array";
                }
                return elements.pop() || MK_NULL();
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        length: {
            type: "native-fn",
            call: () => MK_NUMBER(elements.length),
            line: array.line,
            column: array.column
        } as NativeFnVal,
        includes: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                if (args.length !== 1) {
                    throw "Array includes method requires one argument";
                }
                return MK_BOOL(elements.some(item => 
                    item.type === args[0].type && item.value === args[0].value
                ));
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        indexOf: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                if (args.length !== 1) {
                    throw "Array indexOf method requires one argument";
                }
                return MK_NUMBER(elements.findIndex(item => 
                    item.type === args[0].type && item.value === args[0].value
                ));
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        join: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                const separator = args.length > 0 ? valueToString(args[0]) : ",";
                return MK_STRING(elements.map(v => valueToString(v)).join(separator));
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        slice: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                const start = args[0] ? Number(args[0].value) : 0;
                const end = args[1] ? Number(args[1].value) : elements.length;
                return MK_ARRAY(elements.slice(start, end), array.line, array.column);
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        concat: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                if (args.length !== 1) {
                    throw "Array concat method requires one argument";
                }
                const otherArray = args[0] as ArrayVal;
                return MK_ARRAY(elements.concat(otherArray.value), array.line, array.column);
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        reverse: {
            type: "native-fn",
            call: () => MK_ARRAY([...elements].reverse(), array.line, array.column),
            line: array.line,
            column: array.column
        } as NativeFnVal,
        shift: {
            type: "native-fn",
            call: () => {
                if (elements.length === 0) {
                    throw "Cannot shift from empty array";
                }
                return elements.shift() || MK_NULL();
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        unshift: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                elements.unshift(...args);
                return MK_NUMBER(elements.length);
            },
            line: array.line,
            column: array.column
        } as NativeFnVal,
        filter: {
            type: "native-fn",
            call: (args: RuntimeVal[]) => {
                if (args.length !== 1) {
                    throw "Array filter method requires one argument";
                }
                const callback = args[0] as NativeFnVal;
                return MK_ARRAY(elements.filter(item => {
                    const result = callback.call([item], env, array.line, array.column);
                    return result.type === "boolean" && result.value;
                }), array.line, array.column);
            },
            line: array.line,
            column: array.column
        } as NativeFnVal
    };

    const arr: RuntimeVal = {
        type: "array",
        value: elements,
        methods,
        line: array.line,
        column: array.column
    } as ArrayVal;

    return arr;
}

export function eval_template_string(expr: TemplateString, env: Environment): RuntimeVal {
    let output = "";

    logger.Debug("=== Template String Evaluation ===");
    logger.Debug(`Number of parts: ${expr.parts.length}`);
    logger.Debug(`Parts:`, JSON.stringify(expr, null, 2));
    
    for (const part of expr.parts) {
        if (part.kind === "StringLiteral") {
            logger.Debug(`Processing string literal: "${(part as StringLiteral).value}"`);
            output += (part as StringLiteral).value;
        } else {
            logger.Debug(`Processing expression: ${JSON.stringify(part)}`);
            const value = evaluate(part, env);
            logger.Debug(`Expression evaluated to: ${JSON.stringify(value)}`);
            output += valueToString(value);  // Use valueToString instead of direct toString
        }
        logger.Debug(`Current output: "${output}"`);
    }

    logger.Debug("Output:", output);
    const result = MK_STRING(output);
    logger.Debug(`Returning RuntimeVal: ${JSON.stringify(result)}`);
    logger.Debug(`Returning to caller: ${new Error().stack?.split('\n')[2]}`);
    logger.Debug("=== Template String Evaluation End ===");
    return result;
}

export function eval_member_expr(expr: MemberExpr, env: Environment): RuntimeVal {
    // const obj = (env.lookupVar(expr.object.symbol)) as ObjectVal;
    // return (obj.properties.get(expr.property.symbol)) as RuntimeVal

    const obj = env.lookupVar(expr.object.symbol);

    if (obj.type === "array" && expr.object.kind === "Identifier") {
        const array = obj as ArrayVal;

        if (expr.property.kind === "Identifier") {
            const methodName = (expr.property as Identifier).symbol;
            
            const methods: ArrayMethods = {
                "value": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        if (args.length!== 1) {
                            throw "Array value method requires one argument";
                        }
                        const index = Number(args[0].value);
                        if (index < 0 || index >= array.value.length) {
                            throw "Index out of bounds";
                        }
                        return array.value[index];
                    },
                    line: expr.line,
                    column: expr.column
                },
                "push": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        if (args.length !== 1) {
                            throw "Array push method requires one argument";
                        }
                        array.value.push(args[0]);
                        return MK_NULL();
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "pop": {
                    type: "native-fn",
                    call: () => {
                        if (array.value.length === 0) {
                            throw "Cannot pop from empty array";
                        }
                        return array.value.pop() || MK_NULL();
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "length": {
                    type: "native-fn",
                    call: () => MK_NUMBER(array.value.length),
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "includes": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        if (args.length !== 1) {
                            throw "Array includes method requires one argument";
                        }
                        const target = args[0];
                        return MK_BOOL(array.value.some(item => 
                            item.type === target.type && item.value === target.value
                        ));
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "indexOf": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        if (args.length !== 1) {
                            throw "Array indexOf method requires one argument";
                        }
                        const target = args[0];
                        return MK_NUMBER(array.value.findIndex(item => 
                            item.type === target.type && item.value === target.value
                        ));
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "join": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        const separator = args.length > 0 ? valueToString(args[0]) : ",";
                        return MK_STRING(array.value.map(v => valueToString(v)).join(separator));
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "slice": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        const start = args[0]? Number(args[0].value) : 0;
                        const end = args[1]? Number(args[1].value) : array.value.length;
                        return MK_ARRAY(array.value.slice(start, end), expr.line, expr.column);
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "concat": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        if (args.length!== 1) {
                            throw "Array concat method requires one argument";
                        }
                        const otherArray = args[0] as ArrayVal;
                        return MK_ARRAY(array.value.concat(otherArray.value), expr.line, expr.column);
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "reverse": {
                    type: "native-fn",
                    call: () => MK_ARRAY(array.value.slice().reverse(), expr.line, expr.column),
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "shift": {
                    type: "native-fn",
                    call: () => {
                        if (array.value.length === 0) {
                            throw "Cannot shift from empty array";
                        }
                        return array.value.shift() || MK_NULL();
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "unshift": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        array.value.unshift(...args);
                        return MK_NUMBER(array.value.length);
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
                "filter": {
                    type: "native-fn",
                    call: (args: RuntimeVal[]) => {
                        if (args.length !== 1) {
                            throw "Array filter method requires one argument";
                        }
                        const callback = args[0] as NativeFnVal;
                        return MK_ARRAY(array.value.filter(item => {
                            const result = callback.call([item], env, expr.line, expr.column);
                            return result.type === "boolean" && result.value;
                        }), expr.line, expr.column);
                    },
                    line: expr.line,
                    column: expr.column
                } as NativeFnVal,
            } as const;

            if (methods[methodName]) {
                return methods[methodName];
            }
        }

        // Handle array indexing
        if (expr.property.kind === "NumericLiteral") {
            const index = (expr.property as NumericLiteral).value;
            if (index >= 0 && index < array.value.length) {
                return array.value[index];
            }
            logger.RuntimeError(`Array index out of bounds: ${index} | ${expr.line}:${expr.column}`);
            return MK_NULL();
        }
    }
    
    if (obj.type == "object") {
        const objVal = obj as ObjectVal;
        if (expr.property.kind === "Identifier") {
            const propertyName = (expr.property as Identifier).symbol;
            if (objVal.properties.has(propertyName)) {
                return objVal.properties.get(propertyName) as RuntimeVal;
            }
        }
        logger.RuntimeError(`Property not found in object | ${expr.line}:${expr.column}`);
        Deno.exit(1);
    } else {
        logger.RuntimeError(`Unknown member expression | ${obj.line}:${obj.column}`)
        Deno.exit(1);
    }
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
    const args = expr.args.map(arg => {
        // Check if the argument is a function declaration
        if (arg.kind === "FunctionDeclaration") {
            // Use the current environment as the declaration environment to properly capture lexical scope
            // This ensures callbacks have access to variables in their declaration context
            // Evaluate the function declaration to create a FunctionVal
            const fnArg = arg as FunctionDeclaration;
            const fn = {
                type: "function",
                identifier: fnArg.identifier,
                params: fnArg.params,
                declarationEnv: env, // Use current environment to capture lexical scope
                body: fnArg.body,
                line: fnArg.line,
                column: fnArg.column
            } as FunctionVal;
            return fn;
        }

        // Check if there is a secondary scope inside one of the arguments
        let currentscope: Environment = env;

        // TODO: Potential issue with object member expressions
        if (arg.kind == "ObjectLiteral") {
            currentscope = (arg as ObjectLiteral).scope ? (arg as ObjectLiteral).scope! : env;
        }

        return evaluate(arg, currentscope);
    });
    
    const fn = evaluate(expr.caller, env);

    if (fn.type == "native-fn") {
        const result = (fn as NativeFnVal).call(args, env, expr.line, expr.column);
        return result;
    }

    if (fn.type == "function") {
        const func = fn as FunctionVal;
        const scope = new Environment(func.declarationEnv);

        // Check parameter count
        if (args.length !== func.params.length) {
            logger.RuntimeError(
                `Function ${func.identifier} expects ${func.params.length} arguments, got ${args.length}`
            );
            Deno.exit(1);
        }

        // Bind arguments to parameters
        for (let i = 0; i < func.params.length; i++) {
            scope.declareVar(func.params[i], args[i], true);
        }

        let result: RuntimeVal = MK_NULL();
        // Evaluate function body
        for (const stmt of func.body) {
            // Handle return statements
            if (stmt.kind == "ReturnStatement") {
                result = eval_return_statement((stmt as ReturnStatement), scope);
                break;
            }
            result = evaluate(stmt, scope);
        }
        return result;
    }
    throw "Invalid Call Expression: Caller must be a function"
}

export function eval_assignment_expr(expr: AssignmentExpr, env: Environment): RuntimeVal {
    logger.Debug("Evaluating assignment for identifier: ", (expr.assignee as Identifier).symbol);
    const value = evaluate(expr.value, env);
    logger.Debug("Assigning value:", JSON.stringify(value, null, 2));
    logger.Debug("Environment before assignment:", JSON.stringify(env, null, 2));
    const result = env.assignVar((expr.assignee as Identifier).symbol, value);
    logger.Debug("Environment after assignment:", JSON.stringify(env, null, 2));
    return result;
}