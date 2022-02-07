"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const Position_1 = require("./Position");
const Token_1 = require("./Token");
const Errors_1 = require("./Errors");
class Lexer {
    constructor(text, table) {
        this.position = new Position_1.PositionHandler(-1, 1, 0);
        this.text = text;
        this.builder = new Token_1.TokenBuilderCtx(table);
        this.table = table;
        this.advance();
    }
    advance(n = 1) {
        while (n-- > 0) {
            this.position.advance(this.currentChar);
        }
        let pos = this.position.index;
        if (pos < this.text.length) {
            this.currentChar = this.text[pos];
        }
        else {
            this.currentChar = undefined;
        }
    }
    peek(n = 1) {
        let pos = this.position.index;
        let peeked = this.text.slice(pos, pos + n);
        return peeked;
    }
    nextToken() {
        var _a;
        while (this.currentChar) {
            if (this.peek(this.table.specialTypes.COMMENT_START.length) === this.table.specialTypes.COMMENT_START) {
                this.skipComment(this.table.specialTypes.COMMENT_END);
            }
            else if (this.peek((_a = this.table.specialTypes.COMMENT_INLINE) === null || _a === void 0 ? void 0 : _a.length) === this.table.specialTypes.COMMENT_INLINE) {
                this.skipComment('\n');
            }
            else {
                const builder = this.builder.getBuilder(this.currentChar);
                if (builder) {
                    if (builder === "skip") {
                        this.advance();
                    }
                    else {
                        return this.buildToken(builder);
                    }
                }
                else
                    this.error();
            }
        }
        return new Token_1.Token(this.builder.table.reservedTypes.EOF);
    }
    skipComment(endif) {
        while (this.currentChar &&
            this.peek(endif.length) !== endif) {
            this.advance();
        }
        if (this.currentChar)
            this.advance(endif.length);
    }
    buildToken(generator) {
        let value = '';
        let start = this.position.position;
        while (this.currentChar) {
            if (generator.include(this.currentChar, value)) {
                value += this.currentChar;
                this.advance();
            }
            else
                break;
        }
        if (generator.raise(value)) {
            this.error();
        }
        return generator.return(value, start);
    }
    error() {
        const error = new Errors_1.IllegalCharError(Errors_1.ErrorCode.ILLEGAL_CHAR, this.position.position);
        throw new Error(error.msg);
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=Lexer.js.map