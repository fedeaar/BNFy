"use strict";
// Position.ts helps keep track of the index, line and column of the characters in a text source. 
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionHandler = void 0;
class PositionHandler {
    /**
     * PositionHandler keeps track of position coordinates for characters in a text source.
     * @param {number} i starting index value. Default = 0.
     * @param {number} ln starting line value. Default = 1.
     * @param {number} col starting column value. Default = 1.
     */
    constructor(i = 0, ln = 1, col = 1) {
        this.i = i;
        this.ln = ln;
        this.col = col;
    }
    /** @returns {number} the current index */
    get index() {
        return this.i;
    }
    /** @returns {position} all position coordinates: [index, line, column]. */
    get position() {
        return [this.i, this.ln, this.col];
    }
    /**
     * advances the current position.
     * @param {string} currentChar the current character of the text source.
     * @returns {number} the new index.
     */
    advance(currentChar) {
        ++this.i;
        if (currentChar === '\n') {
            ++this.ln;
            this.col = 1;
        }
        else {
            ++this.col;
        }
        return this.i;
    }
}
exports.PositionHandler = PositionHandler;
//# sourceMappingURL=Position.js.map