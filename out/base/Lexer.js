"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const Utils_1 = require("../Utils");
const Position_1 = require("./Position");
const Token_1 = require("./Token");
const Errors_1 = require("./Errors");
class Lexer {
    constructor(text, table) {
        this.position = new Position_1.PositionHandler(-1, 1, 0);
        this.text = text;
        this.builder = new TokenBuilderCtx(table);
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
        const pos = this.position.index;
        const peeked = this.text.slice(pos, pos + n);
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
                    this.error(Errors_1.ErrorCode.ILLEGAL_CHAR, this.position.position);
            }
        }
        return new Token_1.Token(this.builder.table.reservedTypes.__EOF__, this.position.position);
    }
    buildToken(generator) {
        let value = '';
        const start = this.position.position;
        while (this.currentChar) {
            if (generator.include(this.currentChar, value)) {
                value += this.currentChar;
                this.advance();
            }
            else
                break;
        }
        if (generator.raise(value)) {
            this.error(Errors_1.ErrorCode.TOKEN_ERROR, start);
        }
        return generator.return(value, start);
    }
    skipComment(endif) {
        while (this.currentChar &&
            this.peek(endif.length) !== endif) {
            this.advance();
        }
        if (this.currentChar)
            this.advance(endif.length);
    }
    error(type, position) {
        let error = null;
        switch (type) {
            case Errors_1.ErrorCode.TOKEN_ERROR:
                error = new Errors_1.TokenError(type, position);
                break;
            case Errors_1.ErrorCode.ILLEGAL_CHAR:
            default:
                error = new Errors_1.IllegalCharError(type, position);
                break;
        }
        throw new Error(error === null || error === void 0 ? void 0 : error.msg);
    }
}
exports.Lexer = Lexer;
class TokenBuilderCtx {
    constructor(table) {
        this.table = table;
        this.compoundMap = this.setCompoundMap(table.compoundTypes);
    }
    getBuilder(currentChar) {
        let builder = null;
        if (this.table.skip.whitespace.includes(currentChar)) {
            builder = "skip";
        }
        else if (this.table.terminals.number.includes(currentChar)) {
            builder = this.numberTokenBuilder();
        }
        else if (this.table.terminals.alpha.includes(currentChar)) {
            builder = this.wordTokenBuilder();
        }
        else if (this.table.terminals.operator.includes(currentChar)) {
            builder = this.operatorTokenBuilder();
        }
        else if (this.table.terminals.delimiter.includes(currentChar)) {
            builder = this.delimiterTokenBuilder();
        }
        else if (this.table.terminals.literal.includes(currentChar)) {
            builder = this.literalTokenBuilder();
        }
        //@ts-ignore: "skip" interpreted as string.
        return builder;
    }
    setCompoundMap(compoundTypes) {
        const compoundMap = {};
        for (const baseType in compoundTypes) {
            compoundMap[baseType] = {};
            //@ts-ignore: baseType interpreted as string.
            const baseTypeCompounds = compoundTypes[baseType];
            for (const type in baseTypeCompounds) {
                const value = baseTypeCompounds[type];
                if (typeof value === 'string') {
                    compoundMap[baseType][value] = type;
                }
                else {
                    for (const innerValue of value) {
                        compoundMap[baseType][innerValue] = type;
                    }
                }
            }
        }
        return compoundMap;
    }
    numberTokenBuilder() {
        const includeFn = (currentChar) => {
            return this.table.terminals.number.includes(currentChar) || currentChar === '.';
        };
        const returnFn = (value, start) => {
            let type = null;
            if (value.includes('.')) {
                type = this.table.reservedTypes.__REAL_CONST__;
            }
            else {
                type = this.table.reservedTypes.__INTEGER_CONST__;
            }
            return new Token_1.Token(type, start, value);
        };
        const raiseFn = (formedValue) => {
            let times = 0;
            for (let i = 0; i < formedValue.length && times < 2; ++i) {
                if (formedValue[i] === '.') {
                    ++times;
                }
            }
            return times > 1;
        };
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }
    wordTokenBuilder() {
        const includeFn = (currentChar) => {
            return (this.table.terminals.alpha.includes(currentChar) ||
                this.table.terminals.number.includes(currentChar));
        };
        const returnFn = (value, start) => {
            const type = value in this.compoundMap.alpha ?
                this.compoundMap.alpha[value] :
                this.table.baseTypes.alpha;
            const token = new Token_1.Token(type, start, value);
            return token;
        };
        const raiseFn = (formedValue) => {
            return false;
        };
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }
    operatorTokenBuilder() {
        const includeFn = (currentChar, currentValue) => {
            let include = false;
            if (!(currentValue in Object.values(this.table.specialTypes))) {
                include = (0, Utils_1.isKeySubstring)(currentValue + currentChar, this.compoundMap.operator);
            }
            return include;
        };
        const returnFn = (value, start) => {
            const token = new Token_1.Token(this.compoundMap.operator[value], start, value);
            return token;
        };
        const raiseFn = (formedValue) => {
            return !(formedValue in this.compoundMap.operator);
        };
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }
    delimiterTokenBuilder() {
        const includeFn = (currentChar, currentValue) => {
            return (0, Utils_1.isKeySubstring)(currentValue + currentChar, this.compoundMap.delimiter);
        };
        const returnFn = (value, start) => {
            const token = new Token_1.Token(this.compoundMap.delimiter[value], start, value);
            return token;
        };
        const raiseFn = () => false;
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }
    literalTokenBuilder() {
        const includeFn = (currentChar, currentValue) => {
            let include = true;
            if (currentValue.length > 1) {
                include = currentValue[currentValue.length - 1] !== currentValue[0];
            }
            return include;
        };
        const returnFn = (value, start) => {
            let token = new Token_1.Token(this.table.baseTypes.literal, start, value);
            return token;
        };
        const raiseFn = () => false;
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }
}
//# sourceMappingURL=Lexer.js.map