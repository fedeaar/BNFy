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
        if (BNFyAST.__name__ !== "grammar") this.error(ErrorCode.MALFORMED_AST);
        this.controlIdentifiers.clear();
        const InterpretedParserSchema = this.visit(BNFyAST);
        return InterpretedParserSchema;
    }


    /* visit methods */

    protected visit_grammar(node: ParserNode) {}
    protected visit_statement(node: ParserNode) {}
    protected visit_empty(node: ParserNode) {}
    protected visit_declaration(node: ParserNode) {}
    protected visit_syntax(node: ParserNode) {}
    protected visit_sequence(node: ParserNode) {}
    protected visit_repetition(node: ParserNode) {}
    protected visit_conditional(node: ParserNode) {}
    protected visit_identity(node: ParserNode) {}
    protected visit_terminal(node: ParserNode) {}
    protected visit_non_terminal(node: ParserNode) {}
    protected visit_property_assign(node: ParserNode) {}
}