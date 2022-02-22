// main.ts declares the GeneratedParser class and related functions. 

import { replaceAll } from "./Utils";

import { Lexer } from "./base/Lexer";
import { TokenTable } from "./base/Token";
import { BaseParser, ParserNode } from "./base/Parser";

import { BNFyParser } from "./BNFy-0.0.2/Parser";
import { BNFyInterpreter, ParserSchema } from "./BNFy-0.0.2/Interpreter";
import { BNFyTable } from "./BNFy-0.0.2/grammar";


export class GeneratedParser extends BaseParser 
{
	public __table__: TokenTable;
	public __grammar__: string;
	public __schema__: ParserSchema;

	/**
	 * a ready-to-use parser built from a BNFyGrammar and related token table.
	 * @param grammarBNF the grammar for the parser.
	 * @param tokenTable the table for the parser.
	 */
	constructor(grammarBNF: string, tokenTable: TokenTable) {
		super();
		this.__table__ = tokenTable;
		this.__grammar__ = grammarBNF;
		const BNFparser = new BNFyParser(BNFyTable);
		const BNFinterpreter = new BNFyInterpreter(tokenTable); 
		this.__schema__ = BNFinterpreter.interpret(BNFparser.parse(grammarBNF));
		for (const value in this.__schema__.syntax) {
			//@ts-expect-error: anonymous definition of methods. 
			this[value] = this.__schema__.syntax[value].fn;
		}
	}

	public parse(source: string): ParserNode {
		const lexer = new Lexer(source, this.__table__);
		this.set(lexer);
		//@ts-expect-error: anonymous definition of methods.
		return this[this.__schema__.entryPoint.toString()]();
	}
}


export class GeneratedParserFromSchema extends BaseParser 
{
	public __schema__: ParserSchema;
	public __table__: TokenTable;

	/**
	 * a ready-to-use parser built from a ParserSchema.
	 * @param schema the schema to use.
	 */
	constructor(schema: ParserSchema) {
		super();
		this.__schema__ = schema;
		this.__table__ = schema.table;
		for (const value in this.__schema__.syntax) {
			//@ts-expect-error: anonymous definition of methods. 
			this[value] = this.__schema__.syntax[value].fn;
		}
	}

	public parse(source: string): ParserNode {
		const lexer = new Lexer(source, this.__table__);
		this.set(lexer);
		//@ts-expect-error: anonymous definition of methods.
		return this[this.__schema__.entryPoint.toString()]();
	}
}

/**
 * creates a base parser source file from a schema.
 * @param {ParserSchema} schema the schema.
 * @returns {string} a source file string.
 */
export function createParserSourceFile(schema: ParserSchema): string {
	const text = [
		'class Parser extends BaseParser {', 
		'',
		'\tconstructor(table) {',
		'\t\tsuper();',
		'\t\tthis.__table__ = table;',
		'\t}',
		'',
		`\tparse(source) {`,
		`\t\tconst lexer = new Lexer(source, this.__table__);`,
		`\t\tthis.set(lexer);`, 
		`\t\treturn this.${schema.entryPoint}();`,
		'\t}',
		make_fns(schema),
		'}'
	].join('\n');
	function make_fns(schema: ParserSchema): string {
		let fnText = ''
		for (let key in schema.syntax) {
			fnText += `\n\t${key}() {${replaceAll(schema.syntax[key].literal, '\n', '\n\t\t')}\n\t}\n`;
		}
		return fnText.slice(0, -1);
	}
	return text;
}

/**
 * creates a base interpreter source file from a schema.
 * @param {ParserSchema} schema the schema.
 * @returns {string} a source file string.
 */
export function createInterpreterSourceFile(schema: ParserSchema): string {
	const text = [
		'class Interpreter extends NodeVisitor {', 
		'',
		'\tconstructor () {',
		'\t\tsuper();',
		'\t}',
		'',
		`\tinterpret(tree) {`,
		`\t\treturn this.visit(tree);`,
		'\t}',
		make_fns(schema),
		'}'
	].join('\n');
	function make_fns(schema: ParserSchema): string {
		let fnText = ''
		for (let key in schema.syntax) {
			fnText += `\n\tvisit_${key}() {}\n`;
		}
		return fnText.slice(0, -1);
	}
	return text;
}

/**
 * creates a base source file from a schema.
 * @param {ParserSchema} schema the schema.
 * @returns {string} a source file string.
 */
export function createSourceFile(schema: ParserSchema): string {
	return createInterpreterSourceFile(schema) + 
	"\n\n\n" + createParserSourceFile(schema);
}