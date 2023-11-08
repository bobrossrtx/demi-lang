import { logger } from "../helpers/helpers.ts";

export enum TokenType {
    // Literal Types
    Number,
    Identifier,
    String,
    // ClassObject,

    // Keyword
    Let,
    Const,
    Fn,
    Return,
    If,
    Else,
    ElseIf,
    While,
    For,
    Class,
    // Pass,

    // Grouping * Operators
    BinaryOperator, // + - * / %
    Equals,         // =
    Not,            // !
    Less,           // <
    Greater,        // >
    Comma,          // ,
    Dot,            // .
    Colon,          // :
    Semicolon,      // ;
    OpenParen,      // (
    CloseParen,     // )
    OpenBrace,      // {
    CloseBrace,     // }
    OpenBracket,    // [
    CloseBracket,   // ]
    EOF, // End of file
}

const KEYWORDS: Record<string, TokenType> = {
    let: TokenType.Let,
    const: TokenType.Const,
    fn: TokenType.Fn,
    return: TokenType.Return,
    if: TokenType.If,
    else: TokenType.Else,
    elif: TokenType.ElseIf,
    while: TokenType.While,
    for: TokenType.For,
    class: TokenType.Class,
    // pass: TokenType.Pass
}

export interface Token {
    value: string;
    type: TokenType;
    line: number;
    column: number;
}

function token(value = "", type: TokenType, line: number, column: number): Token {
    return { value, type, line, column };
}

function isalpha(src: string): boolean {
    return /^[a-zA-Z_]+$/.test(src);
}

function isint(src: string): boolean {
    return /^[0-9.]+$/.test(src);
}

function isskippable(str: string): boolean {
    return str == " " || str == "\t" || str == "\n" || str == "\r";
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");
    let currline = 1;
    let currcol = 1;

    // Build each token until EOF
    while (src.length > 0) {
        if (src[0] == "\n") {
            currline += 1;
            currcol = 1;
            src.shift();
        }
        else if (src[0] == " ") {
            currcol += 1;
            src.shift();
        }
        else if (src[0] == '(') { tokens.push(token(src.shift(), TokenType.OpenParen, currline, currcol)); currcol += 1; }
        else if (src[0] == ')') { tokens.push(token(src.shift(), TokenType.CloseParen, currline, currcol)); currcol += 1; }
        else if (src[0] == '{') { tokens.push(token(src.shift(), TokenType.OpenBrace, currline, currcol)); currcol += 1; }
        else if (src[0] == '}') { tokens.push(token(src.shift(), TokenType.CloseBrace, currline, currcol)); currcol += 1; }
        else if (src[0] == '[') { tokens.push(token(src.shift(), TokenType.OpenBracket, currline, currcol)); currcol += 1; }
        else if (src[0] == ']') { tokens.push(token(src.shift(), TokenType.CloseBracket, currline, currcol)); currcol += 1; }
        else if (src[0] == '+' || src[0] == '-' || src[0] == '*' || src[0] == '/' || src[0] == '%') { tokens.push(token(src.shift(), TokenType.BinaryOperator, currline, currcol)); currcol += 1; }
        else if (src[0] == '=') { tokens.push(token(src.shift(), TokenType.Equals, currline, currcol)); currcol += 1; }
        else if (src[0] == '<') { tokens.push(token(src.shift(), TokenType.Less, currline, currcol)); currcol += 1; }
        else if (src[0] == '>') { tokens.push(token(src.shift(), TokenType.Greater, currline, currcol)); currcol += 1; }
        else if (src[0] == '!') { tokens.push(token(src.shift(), TokenType.Not, currline, currcol)); currcol += 1; }
        else if (src[0] == ';') { tokens.push(token(src.shift(), TokenType.Semicolon, currline, currcol)); currcol += 1; }
        else if (src[0] == ',') { tokens.push(token(src.shift(), TokenType.Comma, currline, currcol)); currcol += 1; }
        else if (src[0] == '.') { tokens.push(token(src.shift(), TokenType.Dot, currline, currcol)); currcol += 1; }
        else if (src[0] == ':') { tokens.push(token(src.shift(), TokenType.Colon, currline, currcol)); currcol += 1; }
        else if (src[0] == '"' || src[0] == "'") {
            // Build string token
            const tempcurrcol = currcol;

            const doubleQuote = src[0] == '"';

            src.shift(); // Skip the opening quote
            let str = "";

            while (src.length > 0 && src[0] != (doubleQuote ? '"' : "'")) {
                str += src.shift();
                currcol += 1;
            }
            
            src.shift(); // Skip the closing quote
            tokens.push(token(str, TokenType.String, currline, tempcurrcol));
        }
        else if (src[0] == '#') {
            // Skip comment
            // @ts-ignore - Hides the stupid error about src[0] not possibly being '\n'
            while (src.length > 0 && src[0] != '\n')
                src.shift()
        }
        else {
            // Handle multi-character tokens

            // Build number token
            if (isint(src[0])) {
                const tempcurrcol = currcol;
                let num = "";

                while (src.length > 0 && isint(src[0])) {
                    num += src.shift();
                    currcol += 1;
                }

                tokens.push(token(num, TokenType.Number, currline, tempcurrcol));
            }
            else if (src[0] == "-" && isint(src[1])) {
                const tempcurrcol = currcol;
                let num = "-";
                while(num.charAt(0) === '-') {
                    num = num.substring(1);
                    currcol += 1;
                }

                while (src.length > 0 && isint(src[1])) {
                    num += src.shift();
                    currcol += 1;
                }

                tokens.push(token(num, TokenType.Number, currline, tempcurrcol));
            }
            // } else if (isalpha(src[0])) { // Build identifier token
            // Build identifier token with isalpha() and underscores allowed
            else if (isalpha(src[0])) {
                const tempcurrcol = currcol;
                let ident = "";
                while (src.length > 0 && isalpha(src[0])) {
                    ident += src.shift();
                    currcol += 1;
                }

                // Check if identifier is a keyword
                const reserved = KEYWORDS[ident];
                if (typeof reserved == "number") {
                    tokens.push(token(ident, reserved, currline, tempcurrcol));
                } else {
                    tokens.push(token(ident, TokenType.Identifier, currline, tempcurrcol));
                }
            } else if (isskippable(src[0])) { // Skip whitespace
                src.shift(); // SKIP THE CURRENT CHARACTER
            } else {
                // Print error + (character and character code)
                const charcode = src[0].charCodeAt(0);

                logger.CustomError("Unexpected Character", `[${charcode}] "${src[0]}" | ${currline}:${currcol}`);
                Deno.exit(1);
            }
        }
    }

    tokens.push(token("EndOfFile", TokenType.EOF, currline, currcol));
    return tokens;
}
