// Interpreter.ts defines a base class for interpreter classes.

import { ErrorCode, SemanticsError } from "./Errors";
import { ParserNode } from "./Parser";


export class NodeVisitor 
{
    /**
     * main interpret method.
     * @param tree the AST returned by a parser.
     * @returns whatever the defined visit methods interpret. 
     */
    public interpret(tree: ParserNode): any {
        return this.visit(tree);
    } 
    
    /**
     * anonymous caller for this.visit_`node.__node__`() methods.
     * @param node the node to visit.
     * @param params extra parameters. 
     * @returns this.visit_`node.__node__`()'s return value.
     */
    protected visit(node: ParserNode, ...params: any[]): any {
        const method: string = 'visit_' + node.__node__;  
        if (method in this) {
            //@ts-expect-error: anon class methods.
            return this[method](node, ...params);
        } else {
            this.error(ErrorCode.ID_NOT_FOUND, method);
        }
    }

    /**
     * handles error throwing. 
     * @param type an ErrorCode. 
     * @param detailVars relevant variables for the error's 'details' string. 
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
        if (error) {
            throw Error(error.msg);
        }
    }
}   