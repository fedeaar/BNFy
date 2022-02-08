import { ErrorCode, SemanticsError } from '../base/Errors';
import { NodeVisitor } from '../base/InterpreterBase';
import { ParserNode } from '../base/ParserBase';
import { reduceTable, Token, TokenTable } from '../base/Token';
import { formatNestedString } from '../Utils';


export class BNFInterpreter extends NodeVisitor {
    
    tree: ParserNode; 
    table: string[];
    generatedParserTree: {
        [rule: string]: {
            start_node: ParserNode;
            literal: string;
            fn: () => ParserNode;
        }
    } = {};
    entryPoint?: Token;
    control_identifiers = new Set<Token>();

    constructor (tree: ParserNode, table: TokenTable) {
        super();
        this.tree = tree;
        this.table = reduceTable(table);
        this.interpret();
        this.test_identifiers();
	}

    public interpret() {
        this.visit(this.tree);
        return this.generatedParserTree;
    }

    private visit_grammar(node: ParserNode) {
        for (const statement of node.statements) { 
            this.visit(statement);
        }
    }    

    private visit_statement(node: ParserNode) {}

    private visit_empty(node: ParserNode) {}

    private visit_define_stmnt(node: ParserNode) {
        const code = [    
            `let node = {__name__: '${node.def_name}'};`,    
            ...this.visit(node.definition),
            `return node;`
        ];
        const text = formatNestedString(code);
        this.generatedParserTree[node.def_name] = {
            start_node: node,
            literal: text,
            fn: new Function(text) as () => ParserNode
        }
        this.eval_modifiers(node);
    }

    private visit_definition(node: ParserNode, cond?: ParserNode) { // todo rearmar
        let code = [];
        if (cond) {
            code = [
                `else if (${this.visit(cond, false, false)}.includes(this.cToken.type)) {`,
                this.visit(cond),        
                this.visit(node.lNode),
                `}`
            ];
        } else {    
            code = [
                'else {', 
                this.visit(node.lNode),
                '}'
            ];
        }
        if (node.rNode.__name__ === 'definition') {    
            code = [
                ...this.visit(node.rNode, node.cond),
                ...code
            ];
        } else {
            code = [        
                `if (${this.visit(node.cond, false, false)}.includes(this.cToken.type)) {`,        
                this.visit(node.cond),        
                this.visit(node.rNode),
                `}`,
                ...code
            ];
        }
        return code;
    }

    private visit_compound(node: ParserNode) {
        let code = [    
            ...this.visit(node.lNode),    
            ...this.visit(node.rNode)
        ];
        return code;
    }

    private visit_repetition(node: ParserNode) { 
        const oneOrMore = node.operator.type === 'REPEAT_1N';
        let code = [   
            ...this.visit(node.lNode, true, true, true, oneOrMore),    
            `while (${this.visit(node.cond, false, false)}.includes(this.cToken.type)) {`,
            this.visit(node.cond),    
            this.visit(node.lNode),
            `}`
        ];
        return code;
    }

    private visit_concept(node: ParserNode) {}

    private visit_node_assign(node: ParserNode) {
        let code = '';
        let assign = 'node.' + node.assign_node.value;
        if (assign === 'node.__node__') assign = 'node';
        if (node.value.token.type === 'literal') {    
            code = `${assign} = ${this.visit(node.value)};`
        } else {    
            code = `${assign} = node.${this.visit(node.value)};` 
        }
        return [code];
    }

    private visit_id_or_string(node: ParserNode) {
        return [node.token.value];
    }

    private visit_conditional(node: ParserNode) {
        let code = [    
            `if (${this.visit(node.cond, false, false)}.includes(this.cToken.type)) {`,    
            this.visit(node.cond, true),    
            this.visit(node.then),
            `}` 
        ];
        if (node.else) {
            code.push(
                `else {`,        
                this.visit(node.else),
                '}'
            );
        } /* else code += ' '; */
        return code;
    }

    private visit_tokens(node: ParserNode) {}
    
    private visit_token_id(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true) {
        this.test_token_id(node.token);
        let token_type = '';
        if (dont_eat && node.dont_eat) {
            token_type = '';
        } else {    
            token_type = `['${node.token.value}']`;
        }
        let code = '';
        if (full_stmnt) {
            if (token_type !== '') {
                code = `this.eat(${token_type})`;
                if (node.property_name) {
                    code = `${this.visit(node.property_name, code, init, push)}`;
                } else code += ';';
            } 
        } else code = token_type;
        return [code];
    }

    private visit_token_list(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true) {
        let token_list = '';
        if (!(dont_eat && node.dont_eat)) {    
            token_list = `${this.visit(node.list, dont_eat)}`;
            if (token_list === '[]') token_list = '';
        } 
        let code = ''
        if (full_stmnt) {    
            if (token_list !== '') {
                code = `this.eat(${token_list})`;
                if (node.property_name) {   
                    code = `${this.visit(node.property_name, code, init, push)}`;
                } else code += ';';
            }
        } else code = token_list;
        return [code];
    }
    
    private visit_token_chain(node: ParserNode, dont_eat=true) {
        let code = '[';
        for (let token_id of node.tokens) {
            let token_repr = `${this.visit(token_id, dont_eat, false)}`;
            if (token_repr != '') code += token_repr.slice(1, -1) + ', ';
        }
        code = code.slice(0, -2);
        code += ']';
        return [code];
    }

    private visit_control_id(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true) {
        this.control_identifiers.add(node.token);
        let code = [`this.${node.token.value}()`];
        if (full_stmnt) {
            if (node.property_name) {        
                code = this.visit(node.property_name, code, init, push);
            } else code = ['node = ' + code + ';'];
        } 
        return code;
    }

    private visit_property_assign(node: ParserNode, assign='', init=false, push=true) {
        let code = [];
        if (node.is_list) {
            if (init) {        
                code.push(`node.${node.token.value} = [];`);
            }
            if (push) {    
                code.push(`node.${node.token.value}.push(${assign});`);
            }
        } else {    
            code.push(`node.${node.token.value} = ${assign};`);
        }
        return code;
    }

    private eval_modifiers(node: ParserNode) {
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                switch (modifier.value) {
                case 'entry':
                    if (this.entryPoint) {
                        const error = new SemanticsError(ErrorCode.DUPLICATE_ID, modifier, 
                            `entryPoint already defined for '${this.entryPoint.toString()}' at ` + 
                            `[ln: ${this.entryPoint.start[1]}, col: ${this.entryPoint.start[2]}].`)
                        throw new Error(error.msg);
                    } else {
                        this.entryPoint = node.def_name;
                    }
                    break;
                default:
                    break;
                }
            }
        }
    }

    private test_token_id(token: Token) {
        if (!this.table.includes(token.toString())) {
            const error = new SemanticsError(ErrorCode.ID_NOT_FOUND,
                token, 
                `token not defined in table: ${token}`);
            throw Error(error.msg);
        }
    }
    private test_identifiers() {
        for (const identifier of this.control_identifiers) {
            if (!(identifier.toString() in this.generatedParserTree)) {
                const error = new SemanticsError(ErrorCode.ID_NOT_FOUND,
                    identifier, 
                    `non terminal not defined in grammar: ${identifier}`);
                throw Error(error.msg);
            }
        }
    }
}

