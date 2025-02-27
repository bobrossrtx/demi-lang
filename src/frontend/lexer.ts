import { logger } from "../helpers/helpers.ts";

export enum TokenType {
    // Literal Types
    Number,
    Identifier,
    String,

    // String interpolation
    BackTick,               // `
    StringInterpolStart,    // ${
    StringInterpolEnd,      // }

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
    And,            // &&
    Or,             // ||
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
    return str == " " || str == "\t" || str == "\r";
}


function buildStringTokens(src: string[], currcol: number, currline: number, tokens: Token[]): [string, number] {
    const tempcurrcol = currcol;
    const stringType = src[0];
    const isTemplate = stringType === '`';

    src.shift(); // Skip the opening quote
    let str = "";
    let startCol = currcol;

    while (src.length > 0 && src[0] !== stringType) {
        logger.Debug(`Current char: ${src[0]}`);

        // Handle template string interpolation
        if (isTemplate && src[0] === '$' && src[1] === '{') {
            // Push accumulated string if exists
            if (str.length > 0) {
                logger.Debug(`Pushing string part: "${str}"`);
                tokens.push(token(str, TokenType.String, currline, startCol)); // Template parts
                str = "";
            }

            src.shift(); src.shift(); // Skip ${
            logger.Debug("Adding interpolation start token");
            tokens.push(token("${", TokenType.StringInterpolStart, currline, currcol));
            currcol += 2;

            let braceCount = 1;
            let expr = "";

            while (src.length > 0 && braceCount > 0) {
                const currentChar = src[0];
                logger.Debug(`Expression char: ${currentChar}, Brace count: ${braceCount}`);
                
                if ((currentChar as string) === '{') {
                    braceCount++;
                } else if ((currentChar as string) === '}') {
                    braceCount--;
                }
                
                if (braceCount > 0) {
                    expr += currentChar;
                    logger.Debug(`Added to expression: ${expr}`);
                }
                src.shift();
                currcol++;
            }

            if (expr.length > 0) {
                logger.Debug(`Processing expression: ${expr}`);
                const interpolatedTokens = tokenize(expr);
                tokens.push(...interpolatedTokens.slice(0, -1)); // Skip EOF token
            }

            tokens.push(token("}", TokenType.StringInterpolEnd, currline, currcol));
            startCol = currcol;
            continue;
        }

        str += src.shift();
        currcol++;
    }

    src.shift(); // Skip the closing quote

    // Push any remaining string content
    if (str.length > 0) {
        logger.Debug(`Pushing final string part: "${str}"`);
        tokens.push(token(str, TokenType.String, currline, startCol));
    }

    return ["", currcol];
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");
    let currline = 1;
    let currcol = 1;

    // Build each token until EOF
    while (src.length > 0) {
        const char = src[0];
        switch (char) {
            case '\n':
                currline += 1;
                currcol = 1;
                src.shift();
                break;
            case ' ':
                currcol += 1;
                src.shift();
                break;
            case '(': tokens.push(token(src.shift(), TokenType.OpenParen, currline, currcol++)); break;
            case ')': tokens.push(token(src.shift(), TokenType.CloseParen, currline, currcol++)); break;
            case '{': tokens.push(token(src.shift(), TokenType.OpenBrace, currline, currcol++)); break;
            case '}': tokens.push(token(src.shift(), TokenType.CloseBrace, currline, currcol++)); break;
            case '[': tokens.push(token(src.shift(), TokenType.OpenBracket, currline, currcol++)); break;
            case ']': tokens.push(token(src.shift(), TokenType.CloseBracket, currline, currcol++)); break;
            case '+':
            case '-':
            case '*':
            case '/':
            case '%': tokens.push(token(src.shift(), TokenType.BinaryOperator, currline, currcol++)); break;
            case '=': tokens.push(token(src.shift(), TokenType.Equals, currline, currcol++)); break;
            case '<': tokens.push(token(src.shift(), TokenType.Less, currline, currcol++)); break;
            case '>': tokens.push(token(src.shift(), TokenType.Greater, currline, currcol++)); break;
            case '&':
                if (src[1] === '&') {
                    src.shift(); src.shift();
                    tokens.push(token("&&", TokenType.And, currline, currcol));
                    currcol += 2;
                }
                break;
            case '|':
                if (src[1] === '|') {
                    src.shift(); src.shift();
                    tokens.push(token("||", TokenType.Or, currline, currcol));
                    currcol += 2;
                }
                break;
            case '!': tokens.push(token(src.shift(), TokenType.Not, currline, currcol++)); break;
            case ';': tokens.push(token(src.shift(), TokenType.Semicolon, currline, currcol++)); break;
            case ',': tokens.push(token(src.shift(), TokenType.Comma, currline, currcol++)); break;
            case '.': tokens.push(token(src.shift(), TokenType.Dot, currline, currcol++)); break;
            case ':': tokens.push(token(src.shift(), TokenType.Colon, currline, currcol++)); break;
            // case '"':
            // case "'":
            //     const [str, tempcurrcol] = buildRegularString(src, currcol, currline);
            //     tokens.push(token(str, TokenType.String, currline, tempcurrcol));
            //     break;
            // case '`':
            //     const [_, templateCol] = buildTemplateString(src, currcol, currline, tokens);
            //     break;
            case '"':
            case "'":
            case '`': {
                const [_, newCol] = buildStringTokens(src, currcol, currline, tokens);
                currcol = newCol;
                break;
            }
            case '#':
                while (src.length > 0 && src[0] !== '\n') src.shift();
                break;
            default:
                if (isint(char)) {
                    const tempcurrcol = currcol;
                    let num = "";
                    while (src.length > 0 && isint(src[0])) {
                        num += src.shift();
                        currcol++;
                    }
                    tokens.push(token(num, TokenType.Number, currline, tempcurrcol));
                }
                else if (char === "-" && isint(src[1])) {
                    const tempcurrcol = currcol;
                    src.shift();
                    currcol++;
                    let num = "-";
                    while (src.length > 0 && isint(src[0])) {
                        num += src.shift();
                        currcol++;
                    }
                    tokens.push(token(num, TokenType.Number, currline, tempcurrcol));
                }
                else if (isalpha(char)) {
                    const tempcurrcol = currcol;
                    let ident = "";
                    while (src.length > 0 && isalpha(src[0])) {
                        ident += src.shift();
                        currcol++;
                    }
                    const reserved = KEYWORDS[ident];
                    tokens.push(token(ident, reserved ?? TokenType.Identifier, currline, tempcurrcol));
                }
                else if (isskippable(char)) {
                    src.shift();
                }
                else {
                    logger.CustomError("Unexpected Character", `[${char.charCodeAt(0)}] "${char}" | ${currline}:${currcol}`);
                    Deno.exit(1);
                }
        }
    }

    tokens.push(token("EndOfFile", TokenType.EOF, currline, currcol));
    return tokens;
}
