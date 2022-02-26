import { Lexer } from '../base/Lexer';
import { BaseParser } from '../base/Parser';
import { TokenTable } from '../base/Token';

export interface ParserNode 
{
    __node__: string,
    [value: string]: any
}

export class BNFyParser extends BaseParser 
{
	protected __table__: TokenTable;

	/**
     * BNFyParser parses the BNFy grammar.
     * @param table the underlying token table for the parser.
     */
	constructor(table: TokenTable) {
		super();
		this.__table__ = table;
	}

	/**
     * parses a source string.
     * @returns an abstract syntax tree.
     */
	public parse(source: string): ParserNode {
		const lexer = new Lexer(source, this.__table__);
		this.__set__(lexer);
		return this.grammar();
	}

	private grammar(): ParserNode {
		let node: ParserNode = {__node__: 'grammar'};
		node.statements = [];
		while (this.__is__(() => this.statement())) {
			node.statements.push(this.statement());
			this.__eat__(['SEMI']);
		}
		this.__eat__(['__EOF__']);
		return node;
	}

	private statement(): ParserNode {
		let node: ParserNode = {__node__: 'statement'};
		if (this.__is__(() => this.declaration())) {
			node = this.declaration();
		} else { 
			node = this.empty();
		}
		return node;
	}

	private empty(): ParserNode {
		let node: ParserNode = {__node__: 'empty'};
		this.__expect__(["SEMI"]);
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
		} else {
			node = node.lNode;
		}
		return node;
	}

	private sequence(): ParserNode {
		let node: ParserNode = {__node__: 'sequence'};
		node.sequence = [];
		node.sequence.push(this.repetition());
		while (this.__is__(() => this.repetition())) {
			node.sequence.push(this.repetition());
		}
		return node;
	}

	private repetition(): ParserNode {
		let node: ParserNode = {__node__: 'repetition'};
		node.repeats = this.conditional();
		if (['REPEAT_01', 'REPEAT_0N', 'REPEAT_1N'].includes(this.__cToken__.type)) {
			node.operator = this.__eat__(['REPEAT_01', 'REPEAT_0N', 'REPEAT_1N']);
		} else {
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
		} else {
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
		} else if (this.__is__(() => this.non_terminal())) {
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
		if (this.__is__(() => this.property_assign())) {
			node.assigns = this.property_assign();
		}
		this.__eat__(['R_ANGLE']);
		return node;
	}

	private non_terminal(): ParserNode {
		let node: ParserNode = {__node__: 'non_terminal'};
		this.__eat__(['L_BRACKET']);
		node.modifiers = [];
		while (['NT_MODIFIER'].includes(this.__cToken__.type)) {
			node.modifiers.push(this.__eat__(['NT_MODIFIER']));
		}
		node.token = this.__eat__(['alpha']);
		if (this.__is__(() => this.property_assign())) {
			node.assigns = this.property_assign();
		}
		this.__eat__(['R_BRACKET']);
		return node;
	}

	private property_assign(): ParserNode {
		let node: ParserNode = {__node__: 'property_assign'};
		this.__eat__(['COLON']);
		node.name = this.__eat__(['alpha']);
		node.modifiers = [];
		if (['L_SQBRACKET'].includes(this.__cToken__.type)) {
			node.modifiers.push(this.__eat__(['L_SQBRACKET']));
			this.__eat__(['R_SQBRACKET']);
		}
		return node;
	}
}