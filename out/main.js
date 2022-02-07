"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Lexer_1 = require("./base/Lexer");
const Interpreter_1 = require("./bnf/Interpreter");
const Parser_1 = require("./bnf/Parser");
const Table_1 = require("./bnf/Table");
const Utils_1 = require("./Utils");
function run(fileName) {
    const text = (0, Utils_1.openFile)(fileName);
    let lexer = new Lexer_1.Lexer(text, Table_1.table);
    let parser = new Parser_1.Parser(lexer);
    let AST = parser.parse();
    (0, Utils_1.saveFile)('outAST.json', JSON.stringify(AST));
    let interpreter = new Interpreter_1.Interpreter(AST);
    let classf = interpreter.create_class();
    (0, Utils_1.saveFile)('outParse.js', classf);
    lexer = new Lexer_1.Lexer(text, Table_1.table);
    AST = interpreter.useParser(lexer);
    interpreter = new Interpreter_1.Interpreter(AST);
    classf = interpreter.create_class();
    (0, Utils_1.saveFile)('outParse2.js', classf);
}
run('./src/bnf/grammar.txt');
//# sourceMappingURL=main.js.map