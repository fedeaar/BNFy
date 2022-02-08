"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeVisitor = void 0;
const Errors_1 = require("./Errors");
class NodeVisitor {
    visit(node, ...params) {
        let method = 'visit_' + node.__name__;
        if (method in this) {
            //@ts-expect-error: anon class methods ;)
            return this[method](node, ...params);
        }
        else {
            const error = new Errors_1.SemanticsError(Errors_1.ErrorCode.ID_NOT_FOUND, undefined, `not defined: ${method}`);
            throw Error(error.msg);
        }
    }
    interpret(tree) {
        return this.visit(tree);
    }
}
exports.NodeVisitor = NodeVisitor;
//# sourceMappingURL=InterpreterBase.js.map