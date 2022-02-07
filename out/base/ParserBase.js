"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserBase = void 0;
const Errors_1 = require("./Errors");
class ParserBase {
    constructor(lexer, table) {
        this.lexer = lexer;
        this.table = table;
        this.cToken = this.lexer.nextToken();
        this.nToken = this.lexer.nextToken();
    }
    eat(tokenType) {
        const eatString = typeof tokenType === 'string';
        const token = this.cToken;
        if ((eatString && this.cToken.type === tokenType) ||
            (!eatString && tokenType.includes(this.cToken.type))) {
            this.cToken = this.nToken; // change to stack for n-items overlapping rules?
            this.nToken = this.lexer.nextToken();
        }
        else
            this.error(tokenType);
        return token;
    }
    error(expected) {
        const error = new Errors_1.SyntaxError(Errors_1.ErrorCode.UNEXPECTED_TOKEN, this.cToken, `expected token type = ${expected}.`);
        throw new Error(error.msg);
    }
}
exports.ParserBase = ParserBase;
//# sourceMappingURL=ParserBase.js.map