"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeVisitor = void 0;
class NodeVisitor {
    visit(node, ...params) {
        let method = 'visit_' + node.__name__;
        if (method in this) {
            //@ts-ignore
            return this[method](node, ...params);
        }
        else {
            let msg = `no visit method: ${method}`;
            throw Error(msg); // CREAR ERROR CLASS
        }
    }
}
exports.NodeVisitor = NodeVisitor;
//# sourceMappingURL=InterpreterBase.js.map