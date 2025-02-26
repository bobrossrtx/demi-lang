import Environment from "../runtime/environment.ts";

export type NodeType =
    // STATEMENTS
    | "Program"
    | "VarDeclaration"
    | "FunctionDeclaration"
    | "ClassDeclaration"
    | "ReturnStatement"
    | "IfStatement"
    | "WhileStatement"
    | "ForStatement"

    // EXPRESSIONS
    | "AssignmentExpr"
    | "BinaryExpr"
    | "ComparisonExpr"
    | "MemberExpr"
    | "CallExpr"
    | "LogicalExpr"
    | "UnaryExpr"
    // | "PassExpr"

    // LITERALS
    | "Property"
    | "ObjectLiteral"
    | "NumericLiteral"
    | "StringLiteral"
    | "ArrayLiteral"
    | "Identifier"
    | "NullLiteral";


export interface Stmt {
    kind: NodeType;
    line: number;
    column: number;
}

export interface Program extends Stmt {
    kind: "Program";
    body: Stmt[];
}

export interface VarDeclaration extends Stmt {
    kind: "VarDeclaration";
    constant: boolean;
    identifier: string;
    value?: Expr;
    access: "public" | "private";
}

export interface FunctionDeclaration extends Stmt {
    kind: "FunctionDeclaration";
    identifier: string;
    params: string[];
    body: Stmt[];
    access: "public" | "private";
}

export interface ClassDeclaration extends Stmt {
    kind: "ClassDeclaration";
    identifier: string;
    constructor: FunctionDeclaration;
    body: Stmt[];
}

export interface ReturnStatement extends Stmt {
    kind: "ReturnStatement";
    value: Expr;
}

export interface IfStatement extends Stmt {
    kind: "IfStatement";
    condition: Expr;
    body: Stmt[];
    elifs?: { condition: Expr; body: Stmt[] }[];
    elseBody?: Stmt[];
}

export interface WhileStatement extends Stmt {
    kind: "WhileStatement";
    condition: Expr;
    body: Stmt[];
}

export interface ForStatement extends Stmt {
    kind: "ForStatement";
    decl: VarDeclaration;
    condition: ComparisonExpr;
    modification: Expr;
    body: Stmt[];
}

export interface Expr extends Stmt {
    kind: NodeType;
    line: number;
    column: number;
}

export interface AssignmentExpr extends Expr {
    kind: "AssignmentExpr";
    assigne: Expr;
    value: Expr;
}

export interface BinaryExpr extends Expr {
    kind: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface ComparisonExpr extends Expr {
    kind: "ComparisonExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface CallExpr extends Expr {
    kind: "CallExpr";
    caller: Expr;
    args: Expr[];
}

export interface MemberExpr extends Expr {
    kind: "MemberExpr";
    object: Identifier;
    property: Expr;
    computed: boolean;
}

export interface LogicalExpr extends Expr {
    kind: "LogicalExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface UnaryExpr extends Expr {
    kind: "UnaryExpr";
    operator: string;
    operand: Expr;
}

// export interface PassExpr extends Expr {
//     kind: "PassExpr";
//     caller: Expr;
// }

export interface Identifier extends Expr {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expr {
    kind: "NumericLiteral";
    value: number;
}

export interface StringLiteral extends Expr {
    kind: "StringLiteral";
    value: string;
}

export interface Property extends Expr {
    kind: "Property";
    key: string;
    value?: Expr;
}

export interface ObjectLiteral extends Expr {
    kind: "ObjectLiteral";
    properties: Property[];
    scope?: Environment;
}

export interface NullLiteral extends Expr {
    kind: "NullLiteral";
}

export interface ArrayLiteral extends Expr {
    kind: "ArrayLiteral";
    elements: Expr[];
}