import { Lexer } from '../base/Lexer';
import { BaseParser } from '../base/Parser';
import { TokenTable } from '../base/Token';

export interface ParserNode 
{
    __node__: string,
    [value: string]: any
}

export class BNFyParser extends BaseParser {

	protected __table__: TokenTable;

	/**
     * BNFyParser parses the BNFy grammar.
     * @param {TokenTable} table the underlying token table for the parser.
     */
	constructor(table: TokenTable) {
		super();
		this.__table__ = table;
	}

	/**
     * parses a source string.
     * @returns {ParserNode} an abstract syntax tree.
     */
	public parse(source: string): ParserNode {
		const lexer = new Lexer(source, this.__table__);
		this.set(lexer);
		return this.grammar();
	}

	private grammar(): ParserNode {
		let node: ParserNode = {__node__: 'grammar'};
		node.statements = [];
		// repeat statements that start with a terminal should use that
		// as the repeat condition. If it starts with a non terminal,
		// recursively get all terminals up to the first 
		// non optional terminal (fnot) (ie that is not modified by * ? ^).
		// this includes all 'or' fnot
		while (['SEMI', 'D_MODIFIER', 'alpha'].includes(this.__cToken__.type)) {
			node.statements.push(this.statement());
			this.__eat__(['SEMI']);
		}
		this.__eat__(['__EOF__']);
		return node;
	}

	private statement(): ParserNode {
		let node: ParserNode = {__node__: 'statement'};
		if (['alpha', 'D_MODIFIER'].includes(this.__cToken__.type)) {
			node = this.declaration();
		} else {
			node = this.empty();
		}
		return node;
	}

	private empty(): ParserNode {
		let node: ParserNode = {__node__: 'empty'};
		return node;
	}

	private declaration(): ParserNode {
		let node: ParserNode = {__node__: 'declaration'};
		node.modifiers = [];
		while (['D_MODIFIER'].includes(this.__cToken__.type)) {
			node.modifiers.push(this.__eat__(['D_MODIFIER']));
		}
		node.name = this.__eat__(['alpha']);
		this.__eat__(['ASSIGN']);
		node.syntax = this.syntax();
		return node;
	}

	private syntax(): ParserNode {
		let node: ParserNode = {__node__: 'syntax'}; 
		node.lNode = this.sequence();
		if (['OR'].includes(this.__cToken__.type)) {
			this.__eat__(['OR']);
			node.rNode = this.syntax();
		} 
		// main modifier in property assign
		if (Object.keys(node).length === 2) {
			node = node.lNode;
		}
		return node;
	}

	private sequence(): ParserNode {
		let node: ParserNode = {__node__: 'sequence'};
		node.sequence = [];
		node.sequence.push(this.repetition());
		while (['L_PAREN', 'L_ANGLE', 'L_BRACKET'].includes(this.__cToken__.type)) {
			node.sequence.push(this.repetition());
		}
		return node;
	}

	private repetition(): ParserNode {
		let node: ParserNode = {__node__: 'repetition'};
		node.repeats = this.conditional();
		if (['REPEAT_01', 'REPEAT_0N', 'REPEAT_1N'].includes(this.__cToken__.type)) {
			node.operator = this.__eat__(['REPEAT_01', 'REPEAT_0N', 'REPEAT_1N']);
		}
		if (Object.keys(node).length === 2) {
			node = node.repeats;
		}
		return node;
	}

	private conditional(): ParserNode {
		let node: ParserNode = {__node__: 'conditional'};
		node.condition = this.identity();
		if (['IF'].includes(this.__cToken__.type)) {
			this.__eat__(['IF']);
			node.then = this.syntax();
			if (['COLON'].includes(this.__cToken__.type)) {
				this.__eat__(['COLON']);
				node.else = this.syntax();
			}
		} 
		if (Object.keys(node).length === 2) {
			node = node.condition;
		}
		return node;
	}

	private identity(): ParserNode {
		let node: ParserNode = {__node__: 'identity'};
		if (['L_PAREN'].includes(this.__cToken__.type)) {
			this.__eat__(['L_PAREN']);
			node = this.syntax();
			this.__eat__(['R_PAREN']);
		} else if (['L_BRACKET'].includes(this.__cToken__.type)) {
			node = this.non_terminal();
		} else {
			node = this.terminal();
		}
		return node;
	}

	private terminal(): ParserNode {
		let node: ParserNode = {__node__: 'terminal'};
		this.__eat__(['L_ANGLE']);
		if (['NOT'].includes(this.__cToken__.type)) {
			node.dont_eat = this.__eat__(['NOT']);
		}
		node.tokens = [];
		node.tokens.push(this.__eat__(['alpha']));
		while (['COMMA'].includes(this.__cToken__.type)) {
			this.__eat__(['COMMA']);
			node.tokens.push(this.__eat__(['alpha']));
		}
		if (['COLON'].includes(this.__cToken__.type)) {
			node.property_name = this.property_assign();
		}
		this.__eat__(['R_ANGLE']);
		return node;
	}

	private non_terminal(): ParserNode {
		let node: ParserNode = {__node__: 'non_terminal'};
		this.__eat__(['L_BRACKET']);
		node.token = this.__eat__(['alpha']);
		if (['COLON'].includes(this.__cToken__.type)) {
			node.property_name = this.property_assign();
		}
		this.__eat__(['R_BRACKET']);
		return node;
	}

	private property_assign(): ParserNode {
		let node: ParserNode = {__node__: 'property_assign'};
		this.__eat__(['COLON']);
		node.modifiers = [];
		while (['P_MODIFIER'].includes(this.__cToken__.type)) {
			node.modifiers.push(this.__eat__(['P_MODIFIER']));
		}
		node.name = this.__eat__(['alpha']);
		if (['L_SQBRACKET'].includes(this.__cToken__.type)) {
			node.modifiers.push(this.__eat__(['L_SQBRACKET']));
			this.__eat__(['R_SQBRACKET']);
		}
		return node;
	}
}