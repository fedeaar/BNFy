"use strict";
// Parser.ts defines a base class for Parser objects and AST nodes.
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseParser = void 0;
const Errors_1 = require("./Errors");
class BaseParser {
    /**
     * a base class for Parser objects.
     */
    constructor() { }
    /**
     * ensures the current token follow the expected underlying syntax.
     * @param {string | string[]} tokenType the currently valid token types.
     * @returns the evaluated token.
     */
    __eat__(tokenType) {
        if (!this.__cToken__ || !this.__nToken__ || !this.__lexer__) {
            throw new Error('no lexer set for parsing.');
        }
        const eatString = typeof tokenType === 'string';
        const token = this.__cToken__;
        if ((eatString && this.__cToken__.type === tokenType) ||
            (!eatString && tokenType.includes(this.__cToken__.type))) {
            this.__cToken__ = this.__nToken__;
            this.__nToken__ = this.__lexer__.nextToken();
        }
        else
            this.__error__(tokenType);
        return token;
    }
    /**
     * handles error throwing.
     * @param {string | string[]} expected the expected tokens.
     */
    __error__(expected) {
        const error = new Errors_1.SyntaxError(Errors_1.ErrorCode.UNEXPECTED_TOKEN, this.__cToken__, `expected token type = ${expected}.`);
        throw new Error(error.msg);
    }
    /**
     * sets a new lexer for the parser.
     * @param {Lexer} lexer the new lexer.
     */
    set(lexer) {
        this.__lexer__ = lexer;
        this.__cToken__ = this.__lexer__.nextToken();
        this.__nToken__ = this.__lexer__.nextToken();
    }
}
exports.BaseParser = BaseParser;
//# sourceMappingURL=Parser.js.map