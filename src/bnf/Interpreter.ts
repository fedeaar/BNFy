import { NodeVisitor, ParserNode } from '../base/InterpreterBase'
import { Lexer } from '../base/Lexer';
import { ParserBase } from '../base/ParserBase';
import { TokenTable } from '../base/Token';
import { saveFile } from '../Utils';
import { Parser } from './Parser';


export class Interpreter extends NodeVisitor {
    
    tree: ParserNode; 
    generatedParser: {
        [rule: string]: {
            literal: string;
            fn: () => ParserNode;
        }
    } = {};
    entryPoint?: string;
	
    constructor (tree: ParserNode) {
		
        super();
        this.tree = tree;
	}

    public useParser(lexer: Lexer) {
        if (this.generatedParser && this.entryPoint) {
	        let parser = new ParserBase(lexer);
            for (const value in this.generatedParser) {
                //@ts-expect-error
                parser[value] = this.generatedParser[value].fn;
            }
            //@ts-expect-error
            return parser[this.entryPoint]();
        }
    }

    public create_class() {

        const text = [
            'export class Parser extends ParserBase {', 
            '',
            'constructor (lexer) {',
            '   super(lexer);',
            '}',
            `${this.make_fns()}`,
            '}'
        ].join('\n');
        return text;
    }

    private make_fns() {

        this.interpret();
        let text = '';
        text += [`parse(){`,
            `   return ${this.entryPoint? "this." + this.entryPoint + "();" : ""}`,
            '}',
            ''
        ].join(`\n`);
        for (let key in this.generatedParser) {
            text += [
                `${key}() {`,
                `   ${this.generatedParser[key].literal}`,
                `}`,
                ''
            ].join('\n');
        }
        return text;
    }

    public interpret() {

        this.visit(this.tree);
        return this.generatedParser;
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
            `${this.visit(node.definition)}`,
            `return node;`
        ].join(' ');
        this.generatedParser[node.def_name] = {
            literal: code,
            fn: new Function(code) as () => ParserNode
        }
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                if (modifier.value === 'entryPoint') {
                    if (this.entryPoint) {
                        //TODO armar bien
                        throw new Error('semantics error, entryPoint already defined.')
                    }
                    this.entryPoint = node.def_name;
                }
            }
        }
    }

    private visit_definition(node: ParserNode, cond?: ParserNode) { // TODO arreglar
        let code = '';
        if (cond) {
            code = [
                ` else if (${this.visit(cond, false, false)}.includes(this.cToken.type)) {`,
                `${this.visit(cond)}`,        
                `${this.visit(node.lNode)}`,
                `}`
            ].join(' ');
        } else {    
            code = [
                ' else {', 
                `${this.visit(node.lNode)}`,
                '}'
            ].join(' ');
        }
        if (node.rNode.__name__ === 'definition') {    
            code = this.visit(node.rNode, node.cond) + code;
        } else {
            code = [        
                `if (${this.visit(node.cond, false, false)}.includes(this.cToken.type)) {`,        
                `${this.visit(node.cond)}`,        
                `${this.visit(node.rNode)}`,
                `}`
            ].join(' ') + code;
        }
        return code;
    }

    private visit_compound(node: ParserNode) {
        let code = [    
            `${this.visit(node.lNode)}`,    
            `${this.visit(node.rNode)}`
        ].join(' ');
        return code;
    }

    private visit_repetition(node: ParserNode) {
        let code = ``;
        let loop = [    
            `(${this.visit(node.cond, false, false)}.includes(this.cToken.type)) {`,    
            `${this.visit(node.cond)}`,    
            `${this.visit(node.lNode)}`,
            `}`
        ].join(' ');
        if (node.operator.type === 'REPEAT_0N') {
            code = [
                `${this.visit(node.lNode, true, true, true, false)}`,
                `while ${loop}` 
            ].join(' ');
        } 
        else if (node.operator.type === 'REPEAT_1N') {
            code = [
                `${this.visit(node.lNode, true, true, true, true)}`,
                `while ${loop}`
            ].join(' ');
        }
        return code;
    }

    private visit_concept(node: ParserNode) {}

    private visit_node_assign(node: ParserNode) {
        let code = '';
        let assign = 'node.' + node.assign_node.value;
        if (assign == 'node.__node__') assign = 'node';
        let value = '';
        if (node.value.token.type === 'literal') {    
            code = `${assign} = ${this.visit(node.value)};`
        } else {    
            code = `${assign} = node.${this.visit(node.value)};` 
        }
        return code
    }

    private visit_id_or_string(node: ParserNode) {
        return node.token.value;
    }

    private visit_conditional(node: ParserNode) {
        let code = [    
            `if (${this.visit(node.cond, false, false)}.includes(this.cToken.type)) {`,    
            `${this.visit(node.cond, true)}`,    
            `${this.visit(node.then)}`,
            `}` 
        ].join(' ');
        if (node.else) {
            code += [
                `else {`,        
                `${this.visit(node.else)}`,
                '}'
            ].join(' ');
        } else code += ' ';
        return code;
    }

    private visit_tokens(node: ParserNode) {}
    
    private visit_token_id(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true) {
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
                    code = this.visit(node.property_name, code, init, push);
                } else code += ';';
            } 
        } else code = token_type;
        return code;
    }

    private visit_token_list(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true) {
        let token_list = '';
        if (!(dont_eat && node.dont_eat)) {    
            token_list = this.visit(node.list, dont_eat);
            if (token_list === '[]') token_list = '';
        } 
        let code = ''
        if (full_stmnt) {    
            if (token_list !== '') {
                code = `this.eat(${token_list})`;
                if (node.property_name) {   
                    code = this.visit(node.property_name, code, init, push);
                } else code += ';';
            }
        } else code = token_list;
        return code;
    }
    
    private visit_token_chain(node: ParserNode, dont_eat=true) {
        let code = '[';
        for (let token_id of node.tokens) {
            let token_repr = this.visit(token_id, dont_eat, false);
            if (token_repr != '') code += token_repr.slice(1, -1) + ', ';
        }
        code = code.slice(0, -2);
        code += ']';
        return code;
    }

    private visit_control_id(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true) {
        let code = `this.${node.token.value}()`;
        if (full_stmnt) {
            if (node.property_name) {        
                code = this.visit(node.property_name, code, init, push);
            } else code = 'node = ' + code + ';';
        } 
        return code;
    }

    private visit_property_assign(node: ParserNode, assign='', init=false, push=true) {
        let code = '';
        if (node.is_list) {
            if (init) {        
                code += `node.${node.token.value} = []; `
            }
            if (push) {    
                code += `node.${node.token.value}.push(${assign});`
            }
        } else {    
            code += `node.${node.token.value} = ${assign};`
        }
        return code;
    }
}
