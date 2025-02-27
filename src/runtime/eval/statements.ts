import { ClassDeclaration, ForStatement, FunctionDeclaration, IfStatement, Program, ReturnStatement, VarDeclaration, WhileStatement, TemplateString } from "../../frontend/ast.ts";
import { logger } from "../../helpers/helpers.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal,MK_NULL, FunctionVal, ClassVal } from "../values.ts";
import Environment from "../environment.ts";

export function eval_program(program: Program, env: Environment): RuntimeVal {
    logger.Debug("\n=== Program Evaluation Start ===");
    let lastEvaluated: RuntimeVal = MK_NULL();
    
    for (const stmt of program.body) {
        logger.Debug(`Evaluating statement: ${stmt.kind}`);
        logger.Debug("Statement details:", JSON.stringify(stmt, null, 2));
        
        if (stmt.kind === "VarDeclaration") {
            logger.Debug("Variable Declaration found:");
            logger.Debug("- Identifier:", (stmt as VarDeclaration).identifier);
            logger.Debug("- Value kind:", (stmt as VarDeclaration).value?.kind);
            logger.Debug("- Full value:", JSON.stringify((stmt as VarDeclaration).value, null, 2));
        }
        
        lastEvaluated = evaluate(stmt, env);
        logger.Debug("Statement evaluated to:", JSON.stringify(lastEvaluated, null, 2));
    }
    
    logger.Debug("=== Program Evaluation End ===\n");
    return lastEvaluated;
}

// export function eval_var_decl(declaration: VarDeclaration, env: Environment): RuntimeVal {
//     const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
//     return env.declareVar(declaration.identifier, value, declaration.constant);
// }    
export function eval_var_decl(declaration: VarDeclaration, env: Environment): RuntimeVal {
    logger.Debug("\n=== Variable Declaration Start ===");
    logger.Debug(`Declaring: ${declaration.identifier}`);
    logger.Debug("Raw declaration:", JSON.stringify(declaration, null, 2));

    // First, analyze the value's type
    if (declaration.value) {
        logger.Debug(`Value kind: ${declaration.value.kind}`);
        
        if (declaration.value.kind === "TemplateString") {
            logger.Debug("Found template string declaration:");
            logger.Debug("Template parts:", JSON.stringify((declaration.value as TemplateString).parts, null, 2));
            
            // Evaluate template string first
            const evaluated = evaluate(declaration.value, env);
            logger.Debug("Template string evaluated to:", JSON.stringify(evaluated, null, 2));
            
            // Now store the evaluated result
            env.declareVar(declaration.identifier, evaluated, declaration.constant);
            return evaluated;
        }
    }

    // Handle non-template string cases
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
    logger.Debug("Evaluated value:", JSON.stringify(value, null, 2));
    
    env.declareVar(declaration.identifier, value, declaration.constant);
    
    // Verify final stored value
    const stored = env.lookupVar(declaration.identifier);
    logger.Debug("Final stored value:", JSON.stringify(stored, null, 2));
    logger.Debug("=== Variable Declaration End ===\n");
    
    return value;
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