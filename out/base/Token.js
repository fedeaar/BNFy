"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBuilderCtx = exports.Token = void 0;
const Utils = __importStar(require("../Utils"));
class Token {
    constructor(type, value, start) {
        this.type = type;
        this.value = value;
        this.start = start;
    }
    toString() {
        var _a;
        return (_a = this.value) !== null && _a !== void 0 ? _a : `<Token: ${this.type}>`;
    }
}
exports.Token = Token;
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
                type = this.table.reservedTypes.REAL_CONST;
            }
            else {
                type = this.table.reservedTypes.INTEGER_CONST;
            }
            return new Token(type, value, start);
        };
        const raiseFn = (formedValue) => {
            let times = 0;
            for (let i = 0; i < formedValue.length && times < 2; ++i) {
                if (formedValue[i] === '.') {
                    ++times;
                }
            }
            const raise = formedValue.length > 0 ?
                (!this.table.terminals.alpha.includes(formedValue[formedValue.length - 1]) || times > 1) :
                true;
            return raise;
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
            const token = new Token(type, value, start);
            return token;
        };
        const raiseFn = (formedValue) => {
            return Object.values(this.table.reservedTypes).includes(formedValue);
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
                include = Utils.isKeySubstring(currentValue + currentChar, this.compoundMap.operator);
            }
            return include;
        };
        const returnFn = (value, start) => {
            const token = new Token(this.compoundMap.operator[value], value, start);
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
            return Utils.isKeySubstring(currentValue + currentChar, this.compoundMap.delimiter);
        };
        const returnFn = (value, start) => {
            const token = new Token(this.compoundMap.delimiter[value], value, start);
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
            let token = new Token(this.table.baseTypes.literal, value, start);
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
exports.TokenBuilderCtx = TokenBuilderCtx;
//# sourceMappingURL=Token.js.map