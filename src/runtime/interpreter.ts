// deno-lint-ignore-file ban-ts-comment
import Environment from './environment.ts';
import {
ArrayLiteral,
    AssignmentExpr,
    BinaryExpr,
    UnaryExpr,
    CallExpr,
    ClassDeclaration,
    ComparisonExpr,
    ForStatement,
    FunctionDeclaration,
    Identifier,
    IfStatement,
    MemberExpr,
    NumericLiteral,
    ObjectLiteral,
    Program,
    ReturnStatement,
    Stmt,
    StringLiteral,
    VarDeclaration,
    WhileStatement,
    LogicalExpr,
    TemplateString
    } from '../frontend/ast.ts';
import {
eval_array_expr,
    eval_assignment_expr,
    eval_binary_expr,
    eval_call_expr,
    eval_comparison_expr,
    eval_identifier,
    eval_member_expr,
    eval_object_expr,
    eval_template_string
    } from './eval/expressions.ts';
import {
eval_class_decl,
    eval_for_stmt,
    eval_function_decl,
    eval_if_stmt,
    eval_program,
    eval_var_decl,
    eval_while_stmt
    } from './eval/statements.ts';
import { MK_NUMBER, MK_STRING, RuntimeVal, BooleanVal } from './values.ts';
import { logger } from '../helpers/helpers.ts';

function toBooleanValue(value: RuntimeVal) {
    switch (value.type) {
        case "null":
            return false;
        case "number":
            return value.value !== 0;
        case "boolean": 
            return value.value;
        case "string":{
            let str = value.value as string;
            return str.length > 0;
        }
        default:
            return true;
    }
}

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
    logger.AST(astNode, "Evaluating");  // Add this line to log every node being evaluated

    switch (astNode.kind) {
        case "NumericLiteral":
            return MK_NUMBER((astNode as NumericLiteral).value);
        case "StringLiteral":
            return MK_STRING((astNode as StringLiteral).value);
        case "TemplateString": 
            return eval_template_string(astNode as TemplateString, env);
        case "Identifier":
            return eval_identifier(astNode as Identifier, env);
        case "AssignmentExpr":
            return eval_assignment_expr(astNode as AssignmentExpr, env);
        case "BinaryExpr":
            return eval_binary_expr(astNode as BinaryExpr, env);
        case "LogicalExpr": {
            const expr = astNode as LogicalExpr;
            const left = evaluate(expr.left, env);

            // Short circuit if left is false
            if (expr.operator == "&&") {
                if (toBooleanValue(left) == false) return left;
                return evaluate(expr.right, env);
            } else if (expr.operator == "||") {
                if (toBooleanValue(left) == true) return left;
                return evaluate(expr.right, env);
            }
            
            return left;
        }
        case "UnaryExpr": {
            const expr = astNode as UnaryExpr;
            const operand = evaluate(expr.operand, env);

            if (expr.operator === "!")
                return {
                    type: "boolean",
                    value: !toBooleanValue(operand)
                } as BooleanVal;

            return operand;
        }
        case "Program":
            return eval_program(astNode as Program, env);
        case "ObjectLiteral":
            return eval_object_expr(astNode as ObjectLiteral, env);
        case "ArrayLiteral":
            return eval_array_expr(astNode as ArrayLiteral, env)
        case "MemberExpr": {
            // logger.Debug(String(env))
            return eval_member_expr(astNode as MemberExpr, env);
        }
        case "CallExpr":
            return eval_call_expr(astNode as CallExpr, env);
        case "ComparisonExpr":
            return eval_comparison_expr(astNode as ComparisonExpr, env);

        // Handle statements
        case "VarDeclaration": {
            return eval_var_decl(astNode as VarDeclaration, env);
        }
        case "FunctionDeclaration":
            return eval_function_decl(astNode as FunctionDeclaration, env);
        case "ClassDeclaration":
            return eval_class_decl(astNode as ClassDeclaration, env);
        case "ReturnStatement":
            return evaluate((astNode as ReturnStatement).value, env);
        case "IfStatement":
            return eval_if_stmt(astNode as IfStatement, env);
        case "WhileStatement":
            return eval_while_stmt(astNode as WhileStatement, env);
        case "ForStatement":
            return eval_for_stmt(astNode as ForStatement, env);
        case "NullLiteral":
            return { type: "null", line: astNode.line, column: astNode.line };

        // Handle unimplemented ast types as error
        default:
            // @ts-ignore
            logger.RuntimeError(`Unimplemented AST Node:\n${JSON.stringify(astNode, null, 2)}`);
            Deno.exit(1);
    }
}