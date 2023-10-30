import { Token, tokenize, TokenType } from './lexer.ts';
// Where should I add the conditional expression in the order of precedence?
// 1. Assignment
// 2. Conditional
// 3. Logical OR
// 4. Logical AND
// 5. Equality
// 6. Relational
// 7. Additive
// 8. Multiplicative
// 9. Unary
// 10. Call
// 11. Primary
// 12. Member
// 13. Primary
// 14. Identifier
// 15. Literal
// 16. Numeric
// 17. String
// 18. Object

import {
    // PassExpr,
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    Identifier,
    MemberExpr,
    NumericLiteral,
    ObjectLiteral,
    Program,
    Property,
    Stmt,
    VarDeclaration,
    FunctionDeclaration,
    ReturnStatement,
    StringLiteral,
    NullLiteral,
    ComparisonExpr,
    IfStatement,
    WhileStatement,
    ForStatement,
    ClassDeclaration
    } from './ast.ts';

export default class Parser {
    private tokens: Token[] = [];

    private not_eof(): boolean {
        return this.at().type != TokenType.EOF;
    }

    private at() {
        return this.tokens[0] as Token;
    }

    private eat() {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    private expect(type: TokenType, err: string) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type != type) {
            throw `Parser Error: ${err} Expecting: ${TokenType[type]}`
        }

        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            kind: "Program",
            body: [],
        }

        // Parse until EOF
        while (this.not_eof()) {
            program.body.push(this.parse_stmt());
        }

        // console.log(program);

        return program
    }

    private parse_stmt(): Stmt {
        // skip to parse_expr
        switch (this.at().type) {
            case TokenType.Let:
                return this.parse_var_decl();
            case TokenType.Const:
                return this.parse_var_decl();
            case TokenType.Fn:
                return this.parse_fn_decl();
            case TokenType.If:
                return this.parse_if_stmt();
            case TokenType.While:
                return this.parse_while_stmt();
            case TokenType.For:
                return this.parse_for_stmt();
            case TokenType.Class:
                return this.parse_class_decl();
            default:
                return this.parse_expr();
        }
    }

    // ( CONST | LET ) IDENTIFIER ( EQUALS EXPR )? SEMICOLON
    private parse_var_decl(): Stmt {
        const isConstant = this.eat().type == TokenType.Const;

        const identifier = this.expect(
            TokenType.Identifier,
            "Expected identifier after variable declaration."
        ).value;

        if (this.at().type == TokenType.Semicolon) {
            this.eat(); // expect semicolon
            if (isConstant)
                throw "Expected expression after constant declaration.";
            return { kind: "VarDeclaration", identifier, constant: false } as VarDeclaration;
        }

        this.expect(TokenType.Equals, "Expected equals sign after variable declaration.");

        const declaration = { 
            kind: "VarDeclaration",
            identifier,
            value: this.parse_expr(),
            constant: isConstant
        } as VarDeclaration;

        this.expect(TokenType.Semicolon, "Expected semicolon after variable declaration.");
        return declaration;
    }

    // FN IDENTIFIER OPEN_PAREN IDENTIFIER* CLOSE_PAREN OPEN_BRACE STMT* CLOSE_BRACE
    private parse_fn_decl(): Stmt {
        this.eat(); // eat the fn keyword
        const name = this.expect(TokenType.Identifier, "Expected identifier after function declaration.").value;

        const args = this.parse_args();
        const params: string[] = [];

        for (const arg of args) {
            if (arg.kind != "Identifier")
                throw "Unexpected token found inside function declaration. Expected identifier.";

            params.push((arg as Identifier).symbol);
        }

        // Check if the function has private or public access
        let access: "public" | "private" = "public";

        if (this.at().value == "private") {
            this.eat(); // eat the private keyword
            access = "private";
        } else if (this.at().value == "public") {
            this.eat(); // eat the public keyword
            access = "public";
        }

        this.expect(TokenType.OpenBrace, "Expected opening brace after function declaration.");

        const body: Stmt[] = [];

        // parse the body and check for return stmt
        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const stmt = this.parse_stmt();
            body.push(stmt);

            if (this.at().type == TokenType.Return) {
                const return_stmt = this.parse_return_stmt();
                body.push(return_stmt);
            }
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace after function declaration.");

        const fn = {
            kind: "FunctionDeclaration",
            identifier: name,
            params,
            body,
            access,
        } as FunctionDeclaration;
        
        return fn;
    }

    private parse_return_stmt() {
        this.eat(); // eat the return keyword
        const value = this.parse_expr();
        this.expect(TokenType.Semicolon, "Expected semicolon after return statement.");

        return {
            kind: "ReturnStatement",
            value,
        } as ReturnStatement;
    }

    // CLASS IDENTIFIER OPEN_BRACE STMT* CLOSE_BRACE
    private parse_class_decl(): Stmt {
        this.eat(); // eat the class keyword
        const name = this.expect(TokenType.Identifier, "Expected identifier after class declaration.").value;

        this.expect(TokenType.OpenBrace, "Expected opening brace after class declaration.");

        // Check if there is a constructor
        let constructor: FunctionDeclaration | undefined;

        if (this.at().value == "constructor") {
            // parse the constructor manually as it is a special case
            this.eat(); // eat the constructor keyword
            const args = this.parse_args();
            const params: string[] = [];

            for (const arg of args) {
                if (arg.kind != "Identifier")
                    throw "Unexpected token found inside function declaration. Expected identifier.";

                params.push((arg as Identifier).symbol);
            }

            this.expect(TokenType.OpenBrace, "Expected opening brace after constructor declaration.");

            const body: Stmt[] = [];

            // parse the body and check for return stmt
            while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
                const stmt = this.parse_stmt();
                body.push(stmt);

                if (this.at().type == TokenType.Return) {
                    const return_stmt = this.parse_return_stmt();
                    body.push(return_stmt);
                }
            }

            this.expect(TokenType.CloseBrace, "Expected closing brace after constructor declaration.");

            constructor = {
                kind: "FunctionDeclaration",
                identifier: "constructor",
                params,
                body,
                access: "public",
            } as FunctionDeclaration;
        }

        const body: Stmt[] = [];

        // parse the body
        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const stmt = this.parse_stmt();
            body.push(stmt);
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace after class declaration.");

        return {
            kind: "ClassDeclaration",
            constructor,
            identifier: name,
            body,
        } as ClassDeclaration;
    }

    // IF ( EXPR ) OPEN_BRACE STMT* CLOSE_BRACE ( ELSE OPEN_BRACE STMT* CLOSE_BRACE )?
    private parse_if_stmt(): Stmt {
        this.eat(); // eat the if keyword
        this.expect(TokenType.OpenParen, "Expected opening paren after if statement.");

        const condition = (this.parse_expr() as ComparisonExpr);

        this.expect(TokenType.CloseParen, "Expected closing paren after if statement.");
        this.expect(TokenType.OpenBrace, "Expected opening brace after if statement.");

        const body: Stmt[] = [];
        
        // parse the body
        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const stmt = this.parse_stmt();
            body.push(stmt);
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace after if statement.");

        let elifs: { condition: Expr; body: Stmt[] }[] | undefined;

        if (this.at().value == "elif") {
            elifs = [];

            while (this.at().value == "elif") {
                this.eat(); // eat the elif keyword
                this.expect(TokenType.OpenParen, "Expected opening paren after elif statement.");

                const elifcondition = (this.parse_expr() as ComparisonExpr);

                this.expect(TokenType.CloseParen, "Expected closing paren after elif statement.");
                this.expect(TokenType.OpenBrace, "Expected opening brace after elif statement.");

                const elifbody: Stmt[] = [];

                // parse the body
                while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
                    const stmt = this.parse_stmt();
                    elifbody.push(stmt);
                }

                this.expect(TokenType.CloseBrace, "Expected closing brace after elif statement.");

                elifs.push({ condition: elifcondition, body: elifbody });
            }
        }   

        let elseBody: Stmt[] | undefined;

        if (this.at().value == "else") {
            this.eat(); // eat the else keyword
            this.expect(TokenType.OpenBrace, "Expected opening brace after else statement.");
            
            elseBody = [];

            // parse the body
            while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
                const stmt = this.parse_stmt();
                elseBody.push(stmt);
            }
            this.expect(TokenType.CloseBrace, "Expected closing brace after else statement.");   
        }

        return {
            kind: "IfStatement",
            condition,
            body,
            elifs,
            elseBody
        } as IfStatement;
    }

    // WHILE ( EXPR ) OPEN_BRACE STMT* CLOSE_BRACE
    private parse_while_stmt(): Stmt {
        this.eat(); // eat the while keyword
        this.expect(TokenType.OpenParen, "Expected opening paren after while statement.");

        const condition = this.parse_expr();

        this.expect(TokenType.CloseParen, "Expected closing paren after while statement.");
        this.expect(TokenType.OpenBrace, "Expected opening brace after while statement.");

        const body: Stmt[] = [];

        // parse the body
        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const stmt = this.parse_stmt();
            body.push(stmt);
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace after while statement.");

        return {
            kind: "WhileStatement",
            condition,
            body,
        } as WhileStatement;
    }

    private parse_for_stmt(): Stmt {
        this.eat(); // eat the for keyword
        this.expect(TokenType.OpenParen, "Expected open paren after for statement.");

        const decl = this.parse_var_decl(); // Parse the variable declaration

        const condition = (this.parse_expr() as ComparisonExpr);
        this.expect(TokenType.Semicolon, "Expected semicolon after for loop comparison.");

        const modification = this.parse_assignment_expr()
        this.expect(TokenType.CloseParen, "Expected close paren after for statement.");
        this.expect(TokenType.OpenBrace, "Expected open brace after for statement.")

        const body: Stmt[] = [];

        // parse the body
        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const stmt = this.parse_stmt();
            body.push(stmt);
        }

        this.expect(TokenType.CloseBrace, "Expected close brace after for statement.")

        return {
            kind: "ForStatement",
            decl,
            condition,
            modification,
            body
        } as ForStatement
    }

    // TODO: Implement pass expressions
    // private parse_pass_expr(): Expr {
    //     let currTok: Token = this.eat()
    //     while (currTok.type != TokenType.CloseBrace)
    //         currTok = this.eat();
    //     return this.parse_assignment_expr();
    // }

    private parse_expr(): Expr {
        return this.parse_assignment_expr();
    }

    private parse_assignment_expr(): Expr {
        const left = this.parse_object_expr();

        if (this.at().type == TokenType.Equals) {
            this.eat(); // eat the equals sign
            // Check for another equals sign as it might be a comparison expression
            if (this.at().type == TokenType.Equals) {
                this.eat(); // eat the second equals sign

                const right = this.parse_expr();

                return {
                    kind: "ComparisonExpr",
                    left,
                    right,
                    operator: "==",
                } as ComparisonExpr;
            }

            const value = this.parse_assignment_expr();

            return {
                kind: "AssignmentExpr",
                assigne: left,
                value,
            } as AssignmentExpr;
        } else if (this.at().type == TokenType.Not) {
            this.eat(); // eat the not sign
            // Check for another equals sign as it might be a comparison expression
            if (this.at().type == TokenType.Equals) {
                this.eat(); // eat the second equals sign
                
                const right = this.parse_expr();

                return {
                    kind: "ComparisonExpr",
                    left,
                    right,
                    operator: "!=",
                } as ComparisonExpr;
            }
        } else if (this.at().type == TokenType.Less) {
            this.eat(); // eat the less than sign

            // Check for another equals sign as it might be a comparison expression
            if (this.at().type == TokenType.Equals) {
                this.eat(); // eat the second equals sign

                const right = this.parse_expr();

                return {
                    kind: "ComparisonExpr",
                    left,
                    right,
                    operator: "<=",
                } as ComparisonExpr;
            } else {
                const right = this.parse_expr();

                return {
                    kind: "ComparisonExpr",
                    left,
                    right,
                    operator: "<",
                } as ComparisonExpr;
            }
        } else if (this.at().type == TokenType.Greater) {
            this.eat(); // eat the greater than sign

            // Check for another equals sign as it might be a comparison expression
            if (this.at().type == TokenType.Equals) {
                this.eat(); // eat the second equals sign

                const right = this.parse_expr();

                return {
                    kind: "ComparisonExpr",
                    left,
                    right,
                    operator: ">=",
                } as ComparisonExpr;
            } else {
                const right = this.parse_expr();
                
                return {
                    kind: "ComparisonExpr",
                    left,
                    right,
                    operator: ">",
                } as ComparisonExpr;
            }
        }

        return left;
    }

    private parse_object_expr(): Expr {
        // { Prop[] }
        if (this.at().type !== TokenType.OpenBrace) {
            return this.parse_additive_expr();
        }

        this.eat(); // eat the open brace
        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            // { key: val, key2: val2 }
            // { key, key2: val2 }

            const key = this.expect(TokenType.Identifier, "Unexpected token found inside object literal. Expected identifier.").value;

            // Allow for shorthand syntax
            if (this.at().type == TokenType.Comma)  {
                this.eat(); // eat the comma
                properties.push({ kind: "Property", key });
                continue;
            } else if (this.at().type == TokenType.CloseBrace)  {
                properties.push({ kind: "Property", key });
                continue;
            }

            // { key: val }
            this.expect(TokenType.Colon, "Unexpected token found inside object literal. Expected colon.");
            const value = this.parse_expr();
            properties.push({ kind: "Property", key, value });
            
            if (this.at().type != TokenType.CloseBrace) {
                this.expect(TokenType.Comma, "Expected comma or closing brace after object literal property.");
            }
        }

        this.expect(TokenType.CloseBrace, "Unexpected token found inside object literal. Expected closing brace.");
        return {
            kind: "ObjectLiteral",
            properties,
        } as ObjectLiteral;
    }

    private parse_additive_expr(): Expr {
        let left =  this.parse_multiplicitave_expr();

        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parse_multiplicitave_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
        }

        return left;
    }

    private parse_call_member_expr(): Expr {
        const member = this.parse_member_expr();

        if (this.at().type == TokenType.OpenParen) {
            return this.parse_call_expr(member);
        }

        return member;
    }

    private parse_call_expr(caller: Expr): Expr {
        const call_expr: Expr = {
            kind: "CallExpr",
            caller,
            args: this.parse_args(),
        } as CallExpr;
        
        // How would this look like in code:
        // fn fn1()

        if (this.at().type == TokenType.OpenParen) {
            return this.parse_call_expr(call_expr);
        }

        // How would this look like in code:
        // fn fn1()()

        // Check for semicolon unless there is another call expression
        if (this.at().type != TokenType.OpenParen)
            if (this.at().type != TokenType.CloseParen)
                this.expect(TokenType.Semicolon, "Missing semicolon after function call.");

        return call_expr;
    }

    private parse_args(): Expr[] {
        this.expect(TokenType.OpenParen, "Unexpected token found inside function call. Expected opening paren.");
        const args = this.at().type == TokenType.CloseParen
            ? []
            : this.parse_arguments_list();

        this.expect(TokenType.CloseParen, "Unexpected token found inside function call. Expected closing paren.");

        return args;
    }

    private parse_arguments_list(): Expr[] {
        const args = [this.parse_assignment_expr()];
        
        while (this.not_eof() && this.at().type == TokenType.Comma && this.eat())
            args.push(this.parse_assignment_expr());

        return args;
    }

    private parse_member_expr(): Expr {
        let object = this.parse_primary_expr();

        while (this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket) {
            const operator = this.eat();
            let property: Expr;
            let computed: boolean;

            // non-computed values aka object.property
            if (operator.type == TokenType.Dot) {
                computed = false;
                property = this.parse_primary_expr();
                if (property.kind != "Identifier")
                    throw "Unexpected token found inside member expression. Expected identifier.";
            } else if (operator.type == TokenType.OpenBracket) { // computed values aka object[property]
                computed = true;
                property = this.parse_expr();
                this.expect(TokenType.CloseBracket, "Unexpected token found inside member expression. Expected closing bracket.");
            } else {
                throw "Unexpected token found inside member expression. Expected dot or opening bracket.";
            }

            object = {
                kind: "MemberExpr",
                object,
                property,
                computed,
            } as MemberExpr;
        }
        return object;
    }

    private parse_multiplicitave_expr(): Expr {
        let left = this.parse_call_member_expr();

        while (this.at().value == "*" || this.at().value == "/" || this.at().value == "%") {
            const operator = this.eat().value;
            const right = this.parse_call_member_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
        }

        return left;
    }

    private parse_primary_expr(): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: this.eat().value } as Identifier;
            case TokenType.Number:
                return { kind: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral;
            case TokenType.BinaryOperator: {
                let negative = false;
                if (this.eat().value == "-") {
                    negative = true;
                }

                let value = parseFloat(this.eat().value);
                if (negative) value = -Math.abs(value);

                return { kind: "NumericLiteral", value} as NumericLiteral;
            }
            case TokenType.String:
                return { kind: "StringLiteral", value: this.eat().value } as StringLiteral;
            case TokenType.Semicolon:
                this.eat(); // eat the semicolon
                return { kind: "NullLiteral" } as NullLiteral;
            case TokenType.Return:
                return this.parse_return_stmt();
            case TokenType.OpenParen: {
                this.eat(); // eat the open paren
                const expr = this.parse_expr();
                this.expect(
                    TokenType.CloseParen,
                    "Unexpected token found inside parenthesised expression. Expected closing paren."
                ); // eat the close paren
                return expr;
            }
            
            default:
                console.error(`Unexpected token found during parsing! { value: "${this.at().value}", type: ${this.at().type} }`);
                // console.error(`Line: ${this.at().line}, Column: ${this.at().column}``)
                Deno.exit(1);
        }
    }
}
