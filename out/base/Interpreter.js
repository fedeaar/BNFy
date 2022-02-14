"use strict";
// Interpreter.ts defines a base class for interpreter objects.
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeVisitor = void 0;
const Errors_1 = require("./Errors");
class NodeVisitor {
    /**
     * main interpret method.
     * @param {ParserNode} tree the AST returned by a parser.
     * @returns {any} whatever the defined visit methods construct.
     */
    interpret(tree) {
        return this.visit(tree);
    }
    /**
     * anonymous caller for this.visit_{`node.__name__`}().
     * @param {ParserNode} node the node to visit.
     * @param {any[]} params extra parameters to pass.
     * @returns {any} this.visit_{`node.__name__`}()'s return value.
     */
    visit(node, ...params) {
        let method = 'visit_' + node.__name__;
        if (method in this) {
            //@ts-ignore: anon class methods ;)
            return this[method](node, ...params);
        }
        else
            this.error(Errors_1.ErrorCode.ID_NOT_FOUND, method);
    }
    /**
     * handles error throwing.
     * @param {ErrorCode} type the type for the error.
     * @param {string | string[]} detailVars relevant variables for error 'details' string.
     */
    error(type, detailVars) {
        let error = null;
        switch (type) {
            case Errors_1.ErrorCode.ID_NOT_FOUND:
                error = new Errors_1.SemanticsError(Errors_1.ErrorCode.ID_NOT_FOUND, undefined, `not defined: ${detailVars}`);
            default:
                break;
        }
        if (error)
            throw Error(error.msg);
    }
}
exports.NodeVisitor = NodeVisitor;
//# sourceMappingURL=Interpreter.js.map