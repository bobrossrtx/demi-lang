import { AssignmentExpr, BinaryExpr, CallExpr, ComparisonExpr, Identifier, MemberExpr, ObjectLiteral, ReturnStatement } from "../../frontend/ast.ts";
import { logger } from "../../helpers/helpers.ts";
import { evaluate } from "../interpreter.ts";
import { FunctionVal, MK_BOOL, MK_NULL, NativeFnVal, NumberVal, ObjectVal, RuntimeVal } from "../values.ts";
import { eval_return_statement } from "./statements.ts";
import Environment from "../environment.ts";

export function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, binop: BinaryExpr): RuntimeVal {
    let results: number|null = 0;
    
    if (binop.operator == "+") {
        results = lhs.value + rhs.value;
    } else if (binop.operator == "-") {
        results = lhs.value - rhs.value;
    } else if (binop.operator == "*") {
        results = lhs.value * rhs.value;
    } else if (binop.operator == "/") {
        // TODO: Handle divide by zero
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
            return MK_BOOL((lhs as NumberVal).value == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != (rhs as NumberVal).value);
    } else if (lhs.type == "boolean" && rhs.type == "boolean") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as NumberVal).value == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != (rhs as NumberVal).value);
    } else if (lhs.type == "boolean" && rhs.type == "number") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as NumberVal).value == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != (rhs as NumberVal).value);
    } else if (lhs.type == "number" && rhs.type == "boolean") {
        if (expr.operator == "==")
            return MK_BOOL((lhs as NumberVal).value == (rhs as NumberVal).value);
        else if (expr.operator == "!=")
            return MK_BOOL((lhs as NumberVal).value != (rhs as NumberVal).value);
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

export function eval_member_expr(expr: MemberExpr, env: Environment): RuntimeVal {
    const obj = (env.lookupVar(expr.object.symbol)) as ObjectVal;
    return (obj.properties.get(expr.property.symbol)) as RuntimeVal
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
        const result = (fn as NativeFnVal).call(args, env);
        return result;
    }

    if (fn.type == "function") {
        const func = fn as FunctionVal;
        const scope = new Environment(func.declarationEnv);

        if (args.length < func.params.length) {
            logger.RuntimeError(`Function \`${func.identifier}\` expects ${func.params.length} parameters, only found ${args.length} | ${expr.line}:${expr.column}`);
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