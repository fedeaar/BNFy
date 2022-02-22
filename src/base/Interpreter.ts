// Interpreter.ts defines a base class for interpreter objects.

import { ErrorCode, SemanticsError } from "./Errors";
import { ParserNode } from "./Parser";


export class NodeVisitor 
{
    /**
     * main interpret method.
     * @param {ParserNode} tree the AST returned by a parser.
     * @returns {any} whatever the defined visit methods construct. 
     */
    public interpret(tree: ParserNode): any {
        return this.visit(tree);
    } 
    
    /**
     * anonymous caller for this.visit_{`node.__node__`}().
     * @param {ParserNode} node the node to visit.
     * @param {any[]} params extra parameters to pass. 
     * @returns {any} this.visit_{`node.__node__`}()'s return value.
     */
    protected visit(node?: ParserNode, ...params: any[]): any {
        if (!node) return;
        let method: string = 'visit_' + node.__node__;  
        if (method in this) {
            //@ts-ignore: anon class methods ;)
            return this[method](node, ...params);
        } else this.error(ErrorCode.ID_NOT_FOUND, method);
    }

    /**
     * handles error throwing. 
     * @param {ErrorCode} type the type for the error. 
     * @param {string | string[]} detailVars relevant variables for error 'details' string. 
     */
    protected error(type: ErrorCode, detailVars?: string | string[]): void {
        let error = null;
        switch (type) {
        case ErrorCode.ID_NOT_FOUND:
            error = new SemanticsError(
                ErrorCode.ID_NOT_FOUND,
                undefined, 
                `not defined: ${detailVars}`);
        default:
            break;
        }
        if (error) throw Error(error.msg);
    }
}   