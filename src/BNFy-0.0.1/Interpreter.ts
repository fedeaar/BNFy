// ./bnf/Interpreter.ts interprets the BNFyParser's AST structure. It builds the base 
// structure used for generating new parsers.

import { ErrorCode, SemanticsError } from '../base/Errors';

import { NodeVisitor } from '../base/Interpreter';
import { ParserNode } from '../base/Parser';
import { reduceTable, Token, TokenTable } from '../base/Token';
import { formatNestedString } from '../Utils';


export interface ParserSchema 
{
    entryPoint: Token;
    syntax: {
        [rule: string]: {
            start: ParserNode;
            literal: string;
            fn: () => ParserNode;
        }
    }
    table: TokenTable;
}

export class BNFyInterpreter extends NodeVisitor 
{    
    protected table: TokenTable;
    protected reducedTable: string[];
    protected controlIdentifiers = new Set<Token>(); 

    /**
     * BNFyInterpreter handles parser code generation and error checking for BNFy grammars.
     * @param {TokenTable} table the reference TokenTable for the grammar.
     */
    constructor (table: TokenTable) {
        super();
        this.table = table;
        this.reducedTable = reduceTable(table);
	}

    /**
     * main interpret method.
     * @param {ParserNode} BNFyAST a BNFyParser generated AST.
     * @returns {ParserSchema} the schema for the interpreted parser.
     */
    public interpret(BNFyAST: ParserNode): ParserSchema {
        if (BNFyAST.__node__ !== "grammar") this.error(ErrorCode.MALFORMED_AST);
        this.controlIdentifiers.clear();
        const InterpretedParserSchema = this.visit(BNFyAST);
        return InterpretedParserSchema;
    }


    /* visit methods */ 

    protected visit_grammar(node: ParserNode): ParserSchema {   // entry point
        const schema = {
            syntax: {},
            table: this.table 
        } as ParserSchema;  // partial
        for (const statement of node.statements) { 
            const syntax = this.visit(statement);
            if (syntax) {
                const literal = formatNestedString(syntax);
                schema.syntax[statement.def_name] = {
                    start: statement,
                    literal: literal,
                    fn: new Function(literal) as () => ParserNode
                }
                this.eval_modifiers(statement, schema);
            }
        }
        this.test_identifiers(schema);
        this.test_entryPoint(schema);
        return schema;
    }    

    protected visit_statement(node: ParserNode) {}

    protected visit_empty(node: ParserNode) {}

    protected visit_define_stmnt(node: ParserNode): string[] {
        const code = [    
            `let node = {__node__: '${node.def_name}'};`,    
            ...this.visit(node.definition),
            `return node;`
        ];
        return code;
    }

    protected visit_definition(node: ParserNode, cond?: ParserNode): string[] { //test
        const andNode = cond ? 
            [
                `} else if (${this.visit(cond, false, false)}.includes(this.__cToken__.type)) {`,
                    this.visit(cond),        
                    this.visit(node.lNode),
            ] : [
                '} else {', 
                    this.visit(node.lNode),
                '}'
            ];
        const code = node.rNode.__node__ === 'definition' ?
            [
                ...this.visit(node.rNode, node.cond),
                ...andNode
            ] : [        
                `if (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,        
                    this.visit(node.cond),        
                    this.visit(node.rNode),
                ...andNode
            ];
        return code;
    }

    protected visit_compound(node: ParserNode): string[] {
        const code = [    
            ...this.visit(node.lNode),    
            ...this.visit(node.rNode)
        ];
        return code;
    }

    protected visit_repetition(node: ParserNode): string[] { 
        const code = [   
            ...this.visit(node.lNode, true, true, true, node.operator.type === 'REPEAT_1N'),    
            `while (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,
                this.visit(node.cond),    
                this.visit(node.lNode),
            `}`
        ];
        return code;
    }

    protected visit_concept(node: ParserNode) {}

    protected visit_node_assign(node: ParserNode): string[] {
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

    protected visit_id_or_string(node: ParserNode): string[] {
        return [node.token.value];
    }

    protected visit_conditional(node: ParserNode): string[] {
        const code = [    
            `if (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,    
                this.visit(node.cond, true),    
                this.visit(node.then)
        ];
        if (node.else) {
            code.push(
                `} else {`,        
                    this.visit(node.else),
                '}'
            );
        } else {
            code.push('}');
        }
        return code;
    }

    protected visit_tokens(node: ParserNode) {}
    
    protected visit_token_id(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true): string[] {
        this.test_token_id(node.token);
        let token_type = dont_eat && node.dont_eat ? '' : `['${node.token.value}']`;
        let code = [token_type];
        if (full_stmnt) {
            if (token_type !== '') {
                code = [`this.__eat__(${token_type})`];
                if (node.property_name) {
                    code = this.visit(node.property_name, code[0], init, push);
                } else code[0] += ';';
            } 
        } 
        return code;
    }
    
    protected visit_token_list(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true): string[] {
        let token_list = dont_eat && node.dont_eat ? '' : `${this.visit(node.list, dont_eat)}`;
        if (token_list === '[]') {
            token_list = '';
        }
        let code = [token_list];
        if (full_stmnt) {    
            if (token_list !== '') {
                code = [`this.__eat__(${token_list})`];
                if (node.property_name) {   
                    code = this.visit(node.property_name, code[0], init, push);
                } else code[0] += ';';
            }
        } 
        return code;
    }
    
    protected visit_token_chain(node: ParserNode, dont_eat=true): string[] {
        let code = '[';
        for (const token_id of node.tokens) {
            let token_repr = `${this.visit(token_id, dont_eat, false)}`;
            if (token_repr !== '') {
                code += token_repr.slice(1, -1) + ', ';
            }
        }
        code = code.slice(0, -2);
        code += ']';
        return [code];
    }

    protected visit_control_id(node: ParserNode, dont_eat=true, full_stmnt=true, init=false, push=true): string[] {
        this.controlIdentifiers.add(node.token);
        let code = [`this.${node.token.value}()`];
        if (full_stmnt) {
            if (node.property_name) {        
                code = this.visit(node.property_name, code[0], init, push);
            } else code = ['node = ' + code + ';'];
        } 
        return code;
    }

    protected visit_property_assign(node: ParserNode, assign='', init=false, push=true): string[] {
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


    /* eval methods */ 

    protected eval_modifiers(node: ParserNode, schema: ParserSchema): void {
        for (const modifier of node.modifiers) {
            switch (modifier.value) {
            case 'entry':
                if (schema.entryPoint) {
                    const detail = 
                        `entryPoint already defined for '${schema.entryPoint.toString()}' at ` + 
                        `[ln: ${schema.entryPoint.start[1]}, col: ${schema.entryPoint.start[2]}].`
                    this.error(ErrorCode.DUPLICATE_ID, detail, modifier);
                } else {
                    schema.entryPoint = node.def_name;
                }
                break;
            default:
                break;
            }
        }
    }


    /* test methods */ 

    protected test_token_id(token: Token): void {
        const name = token.toString();
        if (!this.reducedTable.includes(name)) {
            this.error(ErrorCode.ID_NOT_FOUND,
                `token not defined in table: ${name}`,
                token);
        }
    }
    protected test_identifiers(schema: ParserSchema): void {
        for (const identifier of this.controlIdentifiers) {
            const name = identifier.toString(); 
            if (!(name in schema.syntax)) {
                this.error(ErrorCode.ID_NOT_FOUND, 
                    `non-terminal not defined in grammar: ${name}`, 
                    identifier);
            }
        }
    }

    protected test_entryPoint(schema: ParserSchema): void {
        if (!schema.entryPoint) {
            this.error(ErrorCode.NO_ENTRYPOINT);
        }
    }
 
    protected error(type: ErrorCode, detail?: string, token?: Token): void {
        let error = null;
        switch (type) {
        case ErrorCode.MALFORMED_AST:
            error = new SemanticsError(ErrorCode.MALFORMED_AST, 
                undefined, 
                "entry node is not 'grammar' in BNFyAST.");
            break;
        case ErrorCode.NO_ENTRYPOINT:
            error = new SemanticsError(ErrorCode.NO_ENTRYPOINT,
                undefined,
                "Use prefix `entry` to declare it in a syntax declaration.");
            break;
        case ErrorCode.ID_NOT_FOUND:
            error = new SemanticsError(ErrorCode.ID_NOT_FOUND,
                token, 
                detail);
            break;
        case ErrorCode.DUPLICATE_ID:
            error = new SemanticsError(ErrorCode.DUPLICATE_ID,
                token, 
                detail);
            break;
        default:
            break;
        }
        if (error) throw new Error(error.msg);
    }
}

