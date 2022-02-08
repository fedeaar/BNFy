import { replaceAll } from "./Utils";

import { ErrorCode, SemanticsError } from "./base/Errors";

import { Lexer } from "./base/Lexer";
import { TokenTable } from "./base/Token";
import { ParserBase, ParserNode } from "./base/ParserBase";

import { BNFParser } from "./bnf/Parser";
import { BNFInterpreter } from "./bnf/Interpreter";
import { BNFTable, BNFGrammar } from "./bnf/grammar";


export class GeneratedParser {

	// generators
	protected grammar: string;
	protected BNFlexer: Lexer;
	protected BNFparser: BNFParser;
	protected BNFinterpreter: BNFInterpreter;
	// parser
	public parser: ParserBase & {
		parse: () => ParserNode,
		[syntax: string]: () => ParserNode
	};
	public table: TokenTable;

	constructor(grammarBNF: string, tokenTable: TokenTable) {
		
		this.grammar = grammarBNF;
		this.BNFlexer = new Lexer(grammarBNF, BNFTable);
		this.BNFparser = new BNFParser(this.BNFlexer);
		this.BNFinterpreter = new BNFInterpreter(this.BNFparser.AST, tokenTable);
		this.table = tokenTable;
		this.parser = this.initParser();
	}

	private initParser() {
		if (!this.BNFinterpreter.entryPoint) {
			const error = new SemanticsError(ErrorCode.ID_NOT_FOUND, undefined, 
				'no entry point for parser declared in bnf source.' +
				'Use prefix `entry` to declare it in a syntax declaration.');
			throw new Error(error.msg);
		}
		const tmp_lexer = new Lexer("", this.table);
		const parser = new ParserBase(tmp_lexer) as GeneratedParser["parser"];
		for (const value in this.BNFinterpreter.generatedParserTree) {
			parser[value] = this.BNFinterpreter.generatedParserTree[value].fn;
		}
		parser.parse = parser[this.BNFinterpreter.entryPoint.toString()];
		return parser;
	}

	public parse(source: string): ParserNode {
		const lexer = new Lexer(source, this.table);
		this.parser.reset(lexer);
		return this.parser.parse();
	}

	public createParserSourceFile(interpreter: BNFInterpreter = this.BNFinterpreter): string {
		const text = [
			'class Parser extends ParserBase {', 
			'',
			'\tconstructor(lexer) {',
			'\t\tsuper(lexer);',
			'\t\tthis.AST = this.parse();',
			'\t}',
			`\tparse() {`,
			`\t\treturn ${interpreter.entryPoint? "this." + interpreter.entryPoint + "();" : ""}`,
			'\t}',
			make_fns(interpreter),
			'}'
		].join('\n');
		function make_fns(interpreter: BNFInterpreter): string {
			let fnText = ''
			for (let key in interpreter.generatedParserTree) {
				fnText += `\n\t${key}() {${replaceAll(interpreter.generatedParserTree[key].literal, '\n', '\n\t\t')}\n\t}`;
			}
			return fnText;
		}
		return text;
	}
	
	public createInterpreterSourceFile(interpreter: BNFInterpreter = this.BNFinterpreter): string {
		const text = [
			'class Interpreter extends NodeVisitor {', 
			'',
			'\tconstructor (AST) {',
			'\t\tsuper();',
			'\t\tthis.tree = AST;',
			'\t}',
			`\tinterpret() {`,
			`\t\treturn this.visit(this.tree);`,
			'\t}',
			make_fns(interpreter),
			'}'
		].join('\n');
		function make_fns(interpreter: BNFInterpreter): string {
			let fnText = ''
			for (let key in interpreter.generatedParserTree) {
				fnText += `\n\tvisit_${key}() {}`;
			}
			return fnText;
		}
		return text;
	}
	
	public createSourceFile(interpreter: BNFInterpreter = this.BNFinterpreter): string {
		return this.createInterpreterSourceFile(interpreter) + 
		"\n\n\n" + this.createParserSourceFile(interpreter);
	}
}
