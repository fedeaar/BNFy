"use strict";
// main.ts declares the GeneratedParser class and related functions. 
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourceFile = exports.createInterpreterSourceFile = exports.createParserSourceFile = exports.GeneratedParserFromSchema = exports.GeneratedParser = void 0;
const Utils_1 = require("./Utils");
const Lexer_1 = require("./base/Lexer");
const Parser_1 = require("./base/Parser");
const Parser_2 = require("./BNFy/Parser");
const Interpreter_1 = require("./BNFy/Interpreter");
const grammar_1 = require("./BNFy/grammar");
class GeneratedParser extends Parser_1.BaseParser {
    /**
     * a ready-to-use parser built from a BNFyGrammar and related token table.
     * @param grammarBNF the grammar for the parser.
     * @param tokenTable the table for the parser.
     */
    constructor(grammarBNF, tokenTable) {
        super();
        this.__table__ = tokenTable;
        this.__grammar__ = grammarBNF;
        const BNFparser = new Parser_2.BNFyParser(grammar_1.BNFyTable);
        const BNFinterpreter = new Interpreter_1.BNFyInterpreter(tokenTable);
        this.__schema__ = BNFinterpreter.interpret(BNFparser.parse(grammarBNF));
        for (const value in this.__schema__.syntax) {
            //@ts-expect-error: anonymous definition of methods. 
            this[value] = this.__schema__.syntax[value].fn;
        }
    }
    parse(source) {
        const lexer = new Lexer_1.Lexer(source, this.__table__);
        this.set(lexer);
        //@ts-expect-error: anonymous definition of methods.
        return this[this.__schema__.entryPoint.toString()]();
    }
}
exports.GeneratedParser = GeneratedParser;
class GeneratedParserFromSchema extends Parser_1.BaseParser {
    /**
     * a ready-to-use parser built from a ParserSchema.
     * @param schema the schema to use.
     */
    constructor(schema) {
        super();
        this.__schema__ = schema;
        this.__table__ = schema.table;
        for (const value in this.__schema__.syntax) {
            //@ts-expect-error: anonymous definition of methods. 
            this[value] = this.__schema__.syntax[value].fn;
        }
    }
    parse(source) {
        const lexer = new Lexer_1.Lexer(source, this.__table__);
        this.set(lexer);
        //@ts-expect-error: anonymous definition of methods.
        return this[this.__schema__.entryPoint.toString()]();
    }
}
exports.GeneratedParserFromSchema = GeneratedParserFromSchema;
/**
 * creates a base parser source file from a schema.
 * @param {ParserSchema} schema the schema.
 * @returns {string} a source file string.
 */
function createParserSourceFile(schema) {
    const text = [
        'class Parser extends ParserBase {',
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
    function make_fns(schema) {
        let fnText = '';
        for (let key in schema.syntax) {
            fnText += `\n\t${key}() {${(0, Utils_1.replaceAll)(schema.syntax[key].literal, '\n', '\n\t\t')}\n\t}\n`;
        }
        return fnText;
    }
    return text;
}
exports.createParserSourceFile = createParserSourceFile;
/**
 * creates a base interpreter source file from a schema.
 * @param {ParserSchema} schema the schema.
 * @returns {string} a source file string.
 */
function createInterpreterSourceFile(schema) {
    const text = [
        'class Interpreter extends NodeVisitor {',
        '',
        '\tconstructor () {',
        '\t\tsuper();',
        '\t}',
        `\tinterpret(tree) {`,
        `\t\treturn this.visit(tree);`,
        '\t}',
        make_fns(schema),
        '}'
    ].join('\n');
    function make_fns(schema) {
        let fnText = '';
        for (let key in schema.syntax) {
            fnText += `\n\tvisit_${key}() {}`;
        }
        return fnText;
    }
    return text;
}
exports.createInterpreterSourceFile = createInterpreterSourceFile;
/**
 * creates a base source file from a schema.
 * @param {ParserSchema} schema the schema.
 * @returns {string} a source file string.
 */
function createSourceFile(schema) {
    return createInterpreterSourceFile(schema) +
        "\n\n\n" + createParserSourceFile(schema);
}
exports.createSourceFile = createSourceFile;
//# sourceMappingURL=main.js.map