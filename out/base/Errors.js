"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticsError = exports.SyntaxError = exports.IllegalCharError = exports.slError = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["ILLEGAL_CHAR"] = "invalid character";
    ErrorCode["UNEXPECTED_TOKEN"] = "unexpected token";
    ErrorCode["ID_NOT_FOUND"] = "identifier not found";
    ErrorCode["DUPLICATE_ID"] = "duplicate identifier declaration";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class slError {
    constructor(errorcode, token, details) {
        this.errorcode = errorcode;
        this.token = token;
        this.details = details;
    }
    get msg() {
        var _a, _b;
        const token_info = this.token ? `\n\ttoken type = ${this.token.type}` : '';
        const token_value = ((_a = this.token) === null || _a === void 0 ? void 0 : _a.value) ? `\n\tvalue = '${this.token.value}'` : '';
        const token_pos = ((_b = this.token) === null || _b === void 0 ? void 0 : _b.start) ? `\n\tposition = [Line: ${this.token.start[1]}, Col: ${this.token.start[2]}]` : '';
        const details = this.details ? `\n\t${this.details}` : '';
        return `\t${this.constructor.name} - ${this.errorcode}.${token_info}${token_value}${token_pos}${details}`;
    }
}
exports.slError = slError;
class IllegalCharError extends slError {
    constructor(errorcode, position) {
        super(errorcode);
        this.position = position;
    }
    get msg() {
        return `${this.constructor.name}: ${this.errorcode}\n\tposition = [Line: ${this.position[1]}, Col: ${this.position[2]}]`;
    }
}
exports.IllegalCharError = IllegalCharError;
class SyntaxError extends slError {
}
exports.SyntaxError = SyntaxError;
class SemanticsError extends slError {
}
exports.SemanticsError = SemanticsError;
//# sourceMappingURL=Errors.js.map