import Environment from '../environment.ts';
import {
    ArrayLiteral,
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    ComparisonExpr,
    Expr,
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

    const arr: RuntimeVal = {
        type: "array",
        value: elements
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
                } as NativeFnVal
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
        logger.CustomError("Unimplemented Error", `Object member expressions have not yet been implemented | ${obj.line}:${obj.column}`);
        Deno.exit(1);
    } else {
        logger.RuntimeError(`Unknown member expression | ${obj.line}:${obj.column}`)
        Deno.exit(1);
    }
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
    const args = expr.args.map(arg => {
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

        if (args.length < func.params.length) {
            logger.RuntimeError(`Function \`${func.identifier}\` expects ${func.params.length} parameters, only found ${args.length} | ${expr.line}:${expr.column}`);
            Deno.exit(1);
        } else if (args.length > func.params.length) {
            logger.RuntimeError(`Function \`${func.identifier}\` expects ${func.params.length} parameters, found ${args.length} instead | ${expr.line}:${expr.column}`);
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

export function eval_assignment_expr(node: AssignmentExpr, env: Environment): RuntimeVal {
    if (node.assigne.kind != "Identifier") {
        throw "Invalid Assignment: Left hand side must be an identifier";
    }

    const varname = (node.assigne as Identifier).symbol;
    return env.assignVar(varname, evaluate(node.value, env));
}