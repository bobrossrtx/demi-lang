import { ClassDeclaration, FunctionDeclaration, IfStatement, Program, ReturnStatement, VarDeclaration, WhileStatement } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal,MK_NULL, FunctionVal, ClassVal } from "../values.ts";

export function eval_program(program: Program, env: Environment): RuntimeVal {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const stmt of program.body)
        lastEvaluated = evaluate(stmt, env);
    return lastEvaluated;
}

export function eval_var_decl(declaration: VarDeclaration, env: Environment): RuntimeVal {
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
    return env.declareVar(declaration.identifier, value, declaration.constant);
}    
    
export function eval_function_decl(declaration: FunctionDeclaration, env: Environment): RuntimeVal {
    // Create new function scope

    const fn = {
        type: "function",
        identifier: declaration.identifier,
        params: declaration.params,
        declarationEnv: env,
        body: declaration.body 
    } as FunctionVal;

    return env.declareVar(declaration.identifier, fn, true);
}

export function eval_class_decl(declaration: ClassDeclaration, env: Environment): RuntimeVal {
    // Create new class scope

    const constructor = {
        type: "function",
        identifier: declaration.constructor.identifier,
        params: declaration.constructor.params,
        declarationEnv: env,
        body: declaration.constructor.body
    } as FunctionVal;

    const cls = {
        type: "class",
        identifier: declaration.identifier,
        constructor: constructor,
        declarationEnv: env,
        body: declaration.body 
    } as ClassVal;

    return env.declareVar(declaration.identifier, cls, true);
}

export function eval_return_statement(stmt: ReturnStatement, env: Environment): RuntimeVal {
    return evaluate(stmt.value, env);
}

export function eval_if_stmt(stmt: IfStatement, env: Environment): RuntimeVal {
    const condition = evaluate(stmt.condition, env);
    if (condition.type != "boolean")
        throw new Error("If statement condition must be a boolean value.");

    // console.log("Condition: ", condition);
    // console.log(stmt);

    if (condition.value == true)
        return eval_program({ kind: "Program", body: stmt.body }, env);
    else if (stmt.elifs) {
        for (const elif of stmt.elifs) {
            const elifCondition = evaluate(elif.condition, env);
            if (elifCondition.type != "boolean")
                throw new Error("Elif statement condition must be a boolean value.");
            if (elifCondition.value == true)
                return eval_program({ kind: "Program", body: elif.body }, env);
        }
    }
    else if (condition.value == false && stmt.elseBody)
        return eval_program({ kind: "Program", body: stmt.elseBody }, env);
    
    return MK_NULL();

}

export function eval_while_stmt(stmt: WhileStatement, env: Environment): RuntimeVal {
    const condition = evaluate(stmt.condition, env);
    if (condition.type != "boolean")
        throw new Error("While statement condition must be a boolean value.");

    let lastEvaluated: RuntimeVal = MK_NULL();
    while (condition.value == true) {
        lastEvaluated = eval_program({ kind: "Program", body: stmt.body }, env);
        condition.value = evaluate(stmt.condition, env).value;
    }
    return lastEvaluated;
}