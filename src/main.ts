import { Lexer } from "./base/Lexer";
import { Interpreter } from "./bnf/Interpreter";
import { Parser } from "./bnf/Parser";
import { table } from "./bnf/Table";
import { openFile, saveFile } from "./Utils";

function run (fileName: string): void {
	
	const text = openFile(fileName);
	let lexer = new Lexer(text, table);
	let parser = new Parser(lexer);

	let AST = parser.parse();
	saveFile('outAST.json', JSON.stringify(AST));

	let interpreter = new Interpreter(AST);
	let classf = interpreter.create_class();
	saveFile('outParse.js', classf);

	lexer = new Lexer(text, table);
	 AST = interpreter.useParser(lexer);
	 interpreter = new Interpreter(AST);
	 classf = interpreter.create_class();
	saveFile('outParse2.js', classf);
}

run('./src/bnf/grammar.txt');
