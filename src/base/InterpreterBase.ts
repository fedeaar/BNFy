export interface ParserNode {

    __name__: string,
    [value: string]: any
}


export class NodeVisitor {

    visit(node: ParserNode, ...params: any[]) {

        let method: string = 'visit_' + node.__name__;  
        if (method in this) {
            //@ts-ignore
            return this[method](node, ...params);
        } else {
            let msg = `no visit method: ${method}`
            throw Error (msg); // CREAR ERROR CLASS
        }
    }
}   