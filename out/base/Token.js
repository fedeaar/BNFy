"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceTable = exports.Token = void 0;
class Token {
    constructor(type, start, value) {
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
function reduceTable(table) {
    const reduced = [
        ...Object.values(table.reservedTypes),
        ...Object.values(table.baseTypes),
        ...Object.values(table.specialTypes)
    ];
    for (let type in table.compoundTypes) {
        //@ts-ignore
        reduced.push(...Object.keys(table.compoundTypes[type]));
    }
    return reduced;
}
exports.reduceTable = reduceTable;
//# sourceMappingURL=Token.js.map