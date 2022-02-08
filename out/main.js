"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedParser = void 0;
const Utils_1 = require("./Utils");
const Errors_1 = require("./base/Errors");
const Lexer_1 = require("./base/Lexer");
const ParserBase_1 = require("./base/ParserBase");
const Parser_1 = require("./bnf/Parser");
const Interpreter_1 = require("./bnf/Interpreter");
const grammar_1 = require("./bnf/grammar");
class GeneratedParser {
    constructor(grammarBNF, tokenTable) {
        this.grammar = grammarBNF;
        this.BNFlexer = new Lexer_1.Lexer(grammarBNF, grammar_1.BNFTable);
        this.BNFparser = new Parser_1.BNFParser(this.BNFlexer);
        this.BNFinterpreter = new Interpreter_1.BNFInterpreter(this.BNFparser.AST, tokenTable);
        this.table = tokenTable;
        this.parser = this.initParser();
    }
    initParser() {
        if (!this.BNFinterpreter.entryPoint) {
            const error = new Errors_1.SemanticsError(Errors_1.ErrorCode.ID_NOT_FOUND, undefined, 'no entry point for parser declared in bnf source.' +
                'Use prefix `entry` to declare it in a syntax declaration.');
            throw new Error(error.msg);
        }
        const tmp_lexer = new Lexer_1.Lexer("", this.table);
        const parser = new ParserBase_1.ParserBase(tmp_lexer);
        for (const value in this.BNFinterpreter.generatedParserTree) {
            parser[value] = this.BNFinterpreter.generatedParserTree[value].fn;
        }
        parser.parse = parser[this.BNFinterpreter.entryPoint.toString()];
        return parser;
    }
    parse(source) {
        const lexer = new Lexer_1.Lexer(source, this.table);
        this.parser.reset(lexer);
        return this.parser.parse();
    }
    createParserSourceFile(interpreter = this.BNFinterpreter) {
        const text = [
            'class Parser extends ParserBase {',
            '',
            '\tconstructor(lexer) {',
            '\t\tsuper(lexer);',
            '\t\tthis.AST = this.parse();',
            '\t}',
            `\tparse() {`,
            `\t\treturn ${interpreter.entryPoint ? "this." + interpreter.entryPoint + "();" : ""}`,
            '\t}',
            make_fns(interpreter),
            '}'
        ].join('\n');
        function make_fns(interpreter) {
            let fnText = '';
            for (let key in interpreter.generatedParserTree) {
                fnText += `\n\t${key}() {${(0, Utils_1.replaceAll)(interpreter.generatedParserTree[key].literal, '\n', '\n\t\t')}\n\t}`;
            }
            return fnText;
        }
        return text;
    }
    createInterpreterSourceFile(interpreter = this.BNFinterpreter) {
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
        function make_fns(interpreter) {
            let fnText = '';
            for (let key in interpreter.generatedParserTree) {
                fnText += `\n\tvisit_${key}() {}`;
            }
            return fnText;
        }
        return text;
    }
    createSourceFile(interpreter = this.BNFinterpreter) {
        return this.createInterpreterSourceFile(interpreter) +
            "\n\n\n" + this.createParserSourceFile(interpreter);
    }
}
exports.GeneratedParser = GeneratedParser;
//# sourceMappingURL=main.js.map