import { ClassDeclaration, ForStatement, FunctionDeclaration, IfStatement, Program, ReturnStatement, VarDeclaration, WhileStatement } from "../../frontend/ast.ts";
import { logger } from "../../helpers/helpers.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal,MK_NULL, FunctionVal, ClassVal } from "../values.ts";
import Environment from "../environment.ts";

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
    if (condition.type != "boolean") {
        logger.RuntimeError("If statement condition must be a boolean value.");
        Deno.exit(1);
    }

    if (condition.value == true)
        return eval_program({ kind: "Program", body: stmt.body, line: stmt.line, column: stmt.column }, env);
    else if (stmt.elifs) {
        for (const elif of stmt.elifs) {
            const elifCondition = evaluate(elif.condition, env);
            if (elifCondition.type != "boolean")
                logger.RuntimeError("Elif statement condition must be a boolean value.");
            if (elifCondition.value == true)
                return eval_program({ kind: "Program", body: elif.body, line: stmt.line, column: stmt.column }, env);
        }
    }
    
    if (condition.value == false && stmt.elseBody)
        return eval_program({ kind: "Program", body: stmt.elseBody, line: stmt.line, column: stmt.column }, env);
    
    return MK_NULL();
}

export function eval_while_stmt(stmt: WhileStatement, env: Environment): RuntimeVal {
    const condition = evaluate(stmt.condition, env);
    if (condition.type != "boolean") {
        logger.RuntimeError("While statement condition must be a boolean value.");
        Deno.exit(1);
    }

    let lastEvaluated: RuntimeVal = MK_NULL();
    while (condition.value == true) {
        lastEvaluated = eval_program({ kind: "Program", body: stmt.body, line: stmt.line, column: stmt.column }, env);
        condition.value = evaluate(stmt.condition, env).value;
    }
    return lastEvaluated;
}

export function eval_for_stmt(stmt: ForStatement, env: Environment): RuntimeVal {
    evaluate(stmt.decl, env); // Evaluate the variable declaration (puts the variable in the env)
    const condition = evaluate(stmt.condition, env); // Evaluates the condition

    if (condition.type != "boolean") {
        logger.RuntimeError("For loop condition must be a boolean value.");
        Deno.exit(1);
    }

    let lastEvaluated: RuntimeVal = MK_NULL();
    while (condition.value == true) {
        lastEvaluated = eval_program({ kind: "Program", body: stmt.body, line: stmt.line, column: stmt.column }, env);
        evaluate(stmt.modification, env); // Update the variable through modification
        condition.value = evaluate(stmt.condition, env).value;
    }

    return lastEvaluated;
}