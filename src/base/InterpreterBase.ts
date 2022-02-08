import { ErrorCode, SemanticsError } from "./Errors";
import { ParserNode } from "./ParserBase";


export class NodeVisitor {

    visit(node: ParserNode, ...params: any[]) {
        let method: string = 'visit_' + node.__name__;  
        if (method in this) {
            //@ts-expect-error: anon class methods ;)
            return this[method](node, ...params);
        } else {
            const error = new SemanticsError(ErrorCode.ID_NOT_FOUND,
                undefined, 
                `not defined: ${method}`);
            throw Error(error.msg);
        }
    }

    interpret(tree: ParserNode) {
        return this.visit(tree);
    }  
}   