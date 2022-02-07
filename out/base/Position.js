"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionHandler = void 0;
class PositionHandler {
    constructor(i = 0, ln = 1, col = 1) {
        this.i = i;
        this.ln = ln;
        this.col = col;
    }
    get index() {
        return this.i;
    }
    get position() {
        return [this.i, this.ln, this.col];
    }
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