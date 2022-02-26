// ./bnf/Interpreter.ts interprets the BNFyParser's AST structure. It builds the base 
// structure used for generating new parsers.

import { ErrorCode, SemanticsError } from '../base/Errors';

import { NodeVisitor } from '../base/Interpreter';
import { ParserNode } from '../base/Parser';
import { reduceTable, Token, TokenTable } from '../base/Token';
import { formatNestedString, NestedArray } from '../Utils';
import { DeclTable } from './declTable'
import { FnotVisitor } from './FnotVisitor';

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
    protected reducedTable: NestedArray<string>;
    protected nonTerminals = new Set<Token>(); 
    protected optionalDecl: boolean = false;

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
        if (BNFyAST.__node__ !== "grammar") {
            this.error(ErrorCode.MALFORMED_AST);
        }
        this.nonTerminals.clear();
        return this.visit(BNFyAST);
    }


    /* visit methods */

    protected visit_grammar(node: ParserNode) {
        const schema: any = {
            syntax: {},
            table: this.table 
        }
        for (const statement of node.statements) { 
            const literal = formatNestedString(this.visit(statement));
            schema.syntax[statement.name] = {
                start: statement,
                literal: literal,
                fn: new Function(literal)
            };
            this.eval_name(statement.name);
            this.eval_modifiers(statement, schema);
        }
        this.test_non_terminals(schema);
        this.test_entryPoint(schema);
        return schema;
    }
    
    protected visit_statement(node: ParserNode) {}
    
    protected visit_empty(node: ParserNode) {}

    protected visit_declaration(node: ParserNode): NestedArray<string> {
        const table = new DeclTable(node);
        const declTable = table.stringify();
        this.optionalDecl = declTable.length === 0;
        const comma = declTable.length > 0 ? ",": "";
        const code = [    
            `let node = {`,
                [`__node__: "${node.name}"${comma}`],
                declTable,
            `};`,    
            ...this.visit(node.syntax),
            ...table.stringifyMainCondition(),
            `return node;`
        ];
        return code;
    }

    protected visit_syntax(node: ParserNode): NestedArray<string> {
        const code = [
            `if (${this.parse_fnot(node.lNode)}) {`,
                this.visit(node.lNode)
        ];
        const rNode = this.visit(node.rNode);
        if (node.rNode.__node__ === "syntax") {
            rNode[0] = `} else ${rNode[0]}`
            code.push(...rNode);
        } else {
            code.push('} else {', 
                rNode, 
            '}');
        }
        return code;
    }

    protected visit_sequence(node: ParserNode): NestedArray<string> {
        const code = [];
        for (const element of node.sequence) {
            code.push(...this.visit(element));
        }
        return code;
    }

    protected visit_repetition(node: ParserNode): NestedArray<string> {
        const operator = node.operator.value;
        let code = [
            `${operator === "^" ? "if" : "while"} (${this.parse_fnot(node.repeats)}) {`,
                this.visit(node.repeats),
            `}`
        ];
        if (operator === "+") {
            code = [
                ...this.visit(node.repeats),
                ...code
            ]
        } 
        return code;
    }

    protected visit_conditional(node: ParserNode): NestedArray<string> {
        const code = [    
            `if (${this.parse_fnot(node.condition)}) {`,    
                this.visit(node.condition),    
                this.visit(node.then)
        ];
        if (node.else) {
            code.push(
                `} else {`, 
                    this.visit(node.else),
                '}');
        } else {
            code.push('}');
        }
        return code;
    }

    protected visit_identity(node: ParserNode) {}

    protected visit_terminal(node: ParserNode, mode: "assign" | "id" = "assign"): NestedArray<string> {
        this.test_terminals(node.tokens);
        let terminal = `[${node.tokens.map((x: Token) => `"${x.value}"`)}]`;
        let code = [`this.__${node.dont_eat ? "expect" : "eat"}__(${terminal})`];
        if (mode === "assign" && node.assigns && !node.dont_eat) {
            code = this.visit(node.assigns, code[0]);
        } else {
            code[0] += ';';
        }
        return mode === "assign" ? code : [terminal];
    }

    protected visit_non_terminal(node: ParserNode, mode: "assign" | "id" = "assign"): NestedArray<string> {
        this.nonTerminals.add(node.token);
        let code = [`this.${node.token.value}()`];
        if (mode === "assign" && node.assigns) {
            code = this.visit(node.assigns, code[0]);
        } else if (mode === "assign") {
            code[0] = (this.optionalDecl ? "node = " : "") + code[0] + ";";
        }
        return code;
    }

    protected visit_property_assign(node: ParserNode, assign: string): NestedArray<string> {
        this.test_property(node.name);
        const code = [];
        const modifiers = node.modifiers.map((x: Token) => x.value);
        if (modifiers.includes('[')) {
            code.push(`node.${node.name}.push(${assign});`);
        } else {
            code.push(`node.${node.name} = ${assign};`);
        }
        return code;
    }

    protected parse_fnot(node: ParserNode): string {  
        return new FnotVisitor(node).interpret();
    }

    /* eval methods */ 

    protected eval_name(name: Token): void {
        const reserved = [
            `parse`, 
            `__set__`, 
            `__eat__`,
            `__expect__`, 
            `__is__`, 
            `__error__`, 
            `__lexer__`, 
            `__cToken__`, 
            `__nToken__`, 
            `__raise_on_success__`, 
            `__table__`, 
            `__grammar__`, 
            `__schema__`
        ];
        if (name.value && reserved.includes(name.value)) {
            this.error(ErrorCode.RESERVED_NAME, undefined, name);
        }
    }

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
                    schema.entryPoint = node.name;
                }
                break;
            default:
                break;
            }
        }
    }

    /* test methods */ 

    protected test_property(token: Token): void {
        const reserved = [
            `__node__`
        ]
        if (token.value && reserved.includes(token.value)) {
            this.error(ErrorCode.RESERVED_NAME, undefined, token);
        }
    }

    protected test_terminals(tokens: Token[]): void {
        for (const token of tokens) {
            const name = token.toString();
            if (!this.reducedTable.includes(name)) {
                this.error(ErrorCode.ID_NOT_FOUND,
                    `token not defined in table: ${name}`,
                    token);
            } 
        }
    }
    protected test_non_terminals(schema: ParserSchema): void {
        for (const identifier of this.nonTerminals) {
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
        case ErrorCode.RESERVED_NAME:
            error = new SemanticsError(ErrorCode.RESERVED_NAME,
                token);
            break;
        default:
            break;
        }
        if (error) throw new Error(error.msg);
    }
}