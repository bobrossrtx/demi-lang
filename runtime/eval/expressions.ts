import { AssignmentExpr, BinaryExpr, CallExpr, ComparisonExpr, Identifier, ObjectLiteral, ReturnStatement } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { FunctionVal, MK_BOOL, MK_NULL, NativeFnVal, NumberVal, ObjectVal, RuntimeVal } from "../values.ts";
import { eval_return_statement } from "./statements.ts";

export function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, operator: string): RuntimeVal {
    let results = 0;
    
    if (operator == "+") {
        results = lhs.value + rhs.value;
    } else if (operator == "-") {
        results = lhs.value - rhs.value;
    } else if (operator == "*") {
        results = lhs.value * rhs.value;
    } else if (operator == "/") {
        // TODO: Handle divide by zero
        results = lhs.value / rhs.value;
    } else if (operator == "%") {
        results = lhs.value % rhs.value;
    } else {
        console.error("Runtime Error: Unimplemented operator: ", operator);
        Deno.exit(1);
    }

    return { type: "number", value: results } as NumberVal;
}

export function eval_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);
    
    if (lhs.type == "number" && rhs.type == "number")
        return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator);

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
    const object = { type: "object", properties: new Map() } as ObjectVal;
    for (const {key, value} of obj.properties) {
        const runtimeVal = (value == undefined) ? env.lookupVar(key) : evaluate(value, env);
        object.properties.set(key, runtimeVal);
    }

    return object;
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
    const args = expr.args.map(arg => evaluate(arg, env));
    const fn = evaluate(expr.caller, env);

    if (fn.type == "native-fn") {
        const result = (fn as NativeFnVal).call(args, env);
        return result;
    }

    if (fn.type == "function") {
        const func = fn as FunctionVal;
        const scope = new Environment(func.declarationEnv);

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

