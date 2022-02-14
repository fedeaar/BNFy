"use strict";
// Errors.ts handles Error definitions for the Lexing - Parsing - Interpeting process.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticsError = exports.SyntaxError = exports.TokenError = exports.IllegalCharError = exports.baseError = exports.ErrorCode = void 0;
/** the defined errors */
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["ILLEGAL_CHAR"] = "invalid character.";
    ErrorCode["UNEXPECTED_TOKEN"] = "unexpected token.";
    ErrorCode["TOKEN_ERROR"] = "unknown or illegal token.";
    ErrorCode["ID_NOT_FOUND"] = "identifier not found.";
    ErrorCode["DUPLICATE_ID"] = "duplicate identifier declaration.";
    ErrorCode["MALFORMED_AST"] = "interpreter called on invalid AST structure.";
    ErrorCode["NO_ENTRYPOINT"] = "no entry point for parser declared in bnf source.";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class baseError {
    /**
     * base error class for the Lexing - Parsing - Interpeting process.
     * @param {ErrorCode?} errorcode the error type.
     * @param {Token?} token the token where the error ocurred.
     * @param {string?} details extra logging information.
     */
    constructor(errorcode, token, details) {
        this.errorcode = errorcode;
        this.token = token;
        this.details = details;
    }
    /** constructs the error msg to display. */
    get msg() {
        var _a, _b;
        const info = this.token ?
            `\n\ttoken type = ${this.token.type}` :
            '';
        const value = ((_a = this.token) === null || _a === void 0 ? void 0 : _a.value) ?
            `\n\tvalue = '${this.token.value}'` :
            '';
        const pos = ((_b = this.token) === null || _b === void 0 ? void 0 : _b.start) ?
            `\n\tposition = [Line: ${this.token.start[1]}, Col: ${this.token.start[2]}]` :
            '';
        const details = this.details ?
            `\n\t${this.details}` :
            '';
        return `\t${this.constructor.name} - ${this.errorcode}.${info}${value}${pos}${details}`;
    }
}
exports.baseError = baseError;
class IllegalCharError extends baseError {
    /**
     * illegal character error class for the Lexing process.
     * @param {ErrorCode} errorcode the error type.
     * @param {position} position where the error ocurred.
     */
    constructor(errorcode, position) {
        super(errorcode);
        this.position = position;
    }
    /** constructs the error msg to display. */
    get msg() {
        return `${this.constructor.name}: ${this.errorcode}\n\tposition = [Line: ${this.position[1]}, Col: ${this.position[2]}]`;
    }
}
exports.IllegalCharError = IllegalCharError;
class TokenError extends IllegalCharError {
}
exports.TokenError = TokenError;
class SyntaxError extends baseError {
}
exports.SyntaxError = SyntaxError;
class SemanticsError extends baseError {
}
exports.SemanticsError = SemanticsError;
//# sourceMappingURL=Errors.js.map