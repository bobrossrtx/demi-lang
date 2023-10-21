// let x = 45 + ( foo * bar )
// [ LetToken, IdentifierToken, EqualsToken, NumberToken]

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
    class: TokenType.Class,
    // pass: TokenType.Pass
}

export interface Token {
    value: string;
    type: TokenType;
    line: number;
    column: number;
}

function token(value = "", type: TokenType): Token {
    return { value, type, line: 0, column: 0 };
}

function isalpha(src: string): boolean {
    return /^[a-zA-Z_]+$/.test(src);
}

function isint(src: string): boolean {
    return /^[0-9]+$/.test(src);
}

function isskippable(str: string): boolean {
    return str == " " || str == "\t" || str == "\n" || str == "\r";
}

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    // Build each token until EOF
    while (src.length > 0) {
        if (src[0] == '(')
            tokens.push(token(src.shift(), TokenType.OpenParen));
        else if (src[0] == ')')
            tokens.push(token(src.shift(), TokenType.CloseParen));
        else if (src[0] == '{')
            tokens.push(token(src.shift(), TokenType.OpenBrace));
        else if (src[0] == '}')
            tokens.push(token(src.shift(), TokenType.CloseBrace));
        else if (src[0] == '[')
            tokens.push(token(src.shift(), TokenType.OpenBracket));
        else if (src[0] == ']')
            tokens.push(token(src.shift(), TokenType.CloseBracket));
        else if (src[0] == '+' || src[0] == '-' || src[0] == '*' || src[0] == '/' || src[0] == '%')
            tokens.push(token(src.shift(), TokenType.BinaryOperator));
        else if (src[0] == '=')
            tokens.push(token(src.shift(), TokenType.Equals));
        else if (src[0] == '<')
            tokens.push(token(src.shift(), TokenType.Less));
        else if (src[0] == '>')
            tokens.push(token(src.shift(), TokenType.Greater));
        else if (src[0] == '!')
            tokens.push(token(src.shift(), TokenType.Not));
        else if (src[0] == ';')
            tokens.push(token(src.shift(), TokenType.Semicolon));
        else if (src[0] == ',')
            tokens.push(token(src.shift(), TokenType.Comma));
        else if (src[0] == '.')
            tokens.push(token(src.shift(), TokenType.Dot));
        else if (src[0] == ':')
            tokens.push(token(src.shift(), TokenType.Colon));
        else if (src[0] == '"' || src[0] == "'") {
            // Build string token

            const doubleQuote = src[0] == '"';

            src.shift(); // Skip the opening quote
            let str = "";

            while (src.length > 0 && src[0] != (doubleQuote ? '"' : "'"))
                str += src.shift();
            
            src.shift(); // Skip the closing quote
            tokens.push(token(str, TokenType.String));
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
                let num = "";
                while (src.length > 0 && isint(src[0]))
                    num += src.shift();

                tokens.push(token(num, TokenType.Number));
            // } else if (isalpha(src[0])) { // Build identifier token
            // Build identifier token with isalpha() and underscores allowed
            } else if (isalpha(src[0])) {
                let ident = "";
                while (src.length > 0 && isalpha(src[0]))
                    ident += src.shift();

                // Check if identifier is a keyword
                const reserved = KEYWORDS[ident];
                if (typeof reserved == "number") {
                    tokens.push(token(ident, reserved));
                } else {
                    tokens.push(token(ident, TokenType.Identifier));
                }
            } else if (isskippable(src[0])) { // Skip whitespace
                src.shift(); // SKIP THE CURRENT CHARACTER
            } else {
                // Print error + (character and character code)
                const charcode = src[0].charCodeAt(0);

                console.log(`Unexpected character: [${charcode}] ${src[0]}`);
                Deno.exit(1);
            }

        }
    }

    tokens.push(token("EndOfFile", TokenType.EOF));
    return tokens;
}
