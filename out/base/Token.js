"use strict";
// Token.ts defines the Token and TokenTable structures, and related functions. 
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceTable = exports.Token = void 0;
class Token {
    /**
     * A token is the smallest significant unit inside a language.
     * @param {string} type the type classification for the given token.
     * @param {position} start the starting position coordinates.
     * @param {string?} value the token's literal value.
     */
    constructor(type, start, value) {
        this.type = type;
        this.value = value;
        this.start = start;
    }
    /**
     * @returns the string representation for this token.
     */
    toString() {
        var _a;
        return (_a = this.value) !== null && _a !== void 0 ? _a : `<Token: ${this.type}>`;
    }
}
exports.Token = Token;
/**
 * reduces the given table to its declared tokens.
 * @param {TokenTable} table the TokenTable to reduce.
 * @returns {string[]} an array of token identifiers.
 */
function reduceTable(table) {
    const reduced = [
        ...Object.values(table.reservedTypes),
        ...Object.values(table.baseTypes),
        ...Object.values(table.specialTypes)
    ];
    for (let type in table.compoundTypes) {
        //@ts-ignore: type is considered string rather than keyof TokenTable["baseTypes"]
        reduced.push(...Object.keys(table.compoundTypes[type]));
    }
    return reduced;
}
exports.reduceTable = reduceTable;
//# sourceMappingURL=Token.js.map