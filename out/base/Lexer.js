"use strict";
// Lexer.ts handles the identification of tokens during the parsing of a source string.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const Utils_1 = require("../Utils");
const Errors_1 = require("./Errors");
const Position_1 = require("./Position");
const Token_1 = require("./Token");
class Lexer {
    /**
     * Handles the identification of tokens in a source string.
     * @param {string} source a string to parse.
     * @param {TokenTable} table the possible tokens and allowed character terminals.
     */
    constructor(source, table) {
        this.position = new Position_1.PositionHandler(-1, 1, 0);
        this.source = source;
        this.table = table;
        this.builder = new TokenBuilderCtx(table);
        this.advance();
    }
    /**
     * advances the current character.
     * @param {number} n how many characters to advance.
     */
    advance(n = 1) {
        while (n-- > 0) {
            this.position.advance(this.currentChar);
        }
        const pos = this.position.index;
        if (pos < this.source.length) {
            this.currentChar = this.source[pos];
        }
        else {
            this.currentChar = undefined;
        }
    }
    /**
     * peeks into the source file.
     * @param {mumber} n the amount of characters to peek at.
     * @returns {string} a substring of the source, from the current character to n (exclusive).
     */
    peek(n = 1) {
        const pos = this.position.index;
        const peeked = this.source.slice(pos, pos + n);
        return peeked;
    }
    /**
     * tries to find the next valid token in the source string.
     * @returns {Token} the next token.
     */
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
        return new Token_1.Token(this.table.reservedTypes.__EOF__, this.position.position);
    }
    /**
     * builds and asserts the validity of the next token.
     * @param {TokenBuilder} generator the building rules for the expected token type.
     * @returns the built Token
     */
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
    /**
     * handles comment skipping.
     * @param {string} endif the skipping end condition.
     */
    skipComment(endif) {
        while (this.currentChar &&
            this.peek(endif.length) !== endif) {
            this.advance();
        }
        if (this.currentChar)
            this.advance(endif.length);
    }
    /**
     * handles error throwing.
     * @param {ErrorCode} type the type for the error.
     * @param {position} position where it ocurred.
     */
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
    /**
     * TokenBuilderCtx handles assigning the correct building rules for Lexer.buildToken().
     * @param table the possible tokens and allowed character terminals.
     */
    constructor(table) {
        this.table = table;
        this.compoundMap = createCompoundMap(table.compoundTypes);
    }
    /**
     * assings a builder based on the current character being processed by the lexer.
     * @param {string} currentChar the last read character.
     * @returns {TokenBuilder | "skip" | null} the builder, a "skip" command or a null
     * value on failure to assign.
     */
    getBuilder(currentChar) {
        let builder = null;
        if (this.table.skip.whitespace.includes(currentChar)) { // move to lexer
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
    /**
     * @returns the build rules for a number token.
     */
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
    /**
     * @returns the builder rules for a word token.
     */
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
    /**
     * @returns the builder rules for an operator token.
     */
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
    /**
     * @returns the builder rules for a delimiter token.
     */
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
    /**
     * @returns the builder rules for a string literal token.
     */
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
/** creates a compound map. */
function createCompoundMap(compoundTypes) {
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
//# sourceMappingURL=Lexer.js.map