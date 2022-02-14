"use strict";
// ./bnf/Parser.ts defines the parser for the BNFy grammar.
Object.defineProperty(exports, "__esModule", { value: true });
exports.BNFyParser = void 0;
const Lexer_1 = require("../base/Lexer");
const Parser_1 = require("../base/Parser");
class BNFyParser extends Parser_1.BaseParser {
    /**
     * BNFyParser parses the BNFy grammar.
     * @param {TokenTable} table the underlying token table for the parser.
     */
    constructor(table) {
        super();
        this.__table__ = table;
    }
    /**
     * parses a source string.
     * @returns {ParserNode} an abstract syntax tree.
     */
    parse(source) {
        const lexer = new Lexer_1.Lexer(source, this.__table__);
        this.set(lexer);
        return this.grammar();
    }
    grammar() {
        let node = { __name__: 'grammar' };
        node.statements = [];
        node.statements.push(this.statement());
        while (['SEMI'].includes(this.__cToken__.type)) {
            this.__eat__(['SEMI']);
            node.statements.push(this.statement());
        }
        this.__eat__(['__EOF__']);
        return node;
    }
    statement() {
        let node = { __name__: 'statement' };
        if (['id', 'MODIFIER'].includes(this.__cToken__.type)) {
            node = this.define_stmnt();
        }
        else {
            node = this.empty();
        }
        return node;
    }
    empty() {
        let node = { __name__: 'empty' };
        return node;
    }
    define_stmnt() {
        let node = { __name__: 'define_stmnt' };
        node.modifiers = [];
        while (['MODIFIER'].includes(this.__cToken__.type)) {
            node.modifiers.push(this.__eat__(['MODIFIER']));
        }
        node.def_name = this.__eat__(['id']);
        node.operator = this.__eat__(['ASSIGN']);
        node.definition = this.definition();
        return node;
    }
    definition() {
        let node = { __name__: 'definition' };
        node.lNode = this.compound();
        if (['OR'].includes(this.__cToken__.type)) {
            this.__eat__(['OR']);
            node.cond = this.tokens();
            node.rNode = this.definition();
        }
        else {
            node = node.lNode;
        }
        return node;
    }
    compound() {
        let node = { __name__: 'compound' };
        node.lNode = this.repetition();
        if (['AND'].includes(this.__cToken__.type)) {
            this.__eat__(['AND']);
            node.rNode = this.compound();
        }
        else {
            node = node.lNode;
        }
        return node;
    }
    repetition() {
        let node = { __name__: 'repetition' };
        node.lNode = this.concept();
        if (['REPEAT_0N', 'REPEAT_1N'].includes(this.__cToken__.type)) {
            node.operator = this.__eat__(['REPEAT_0N', 'REPEAT_1N']);
            node.cond = this.tokens();
        }
        else {
            node = node.lNode;
        }
        return node;
    }
    concept() {
        let node = { __name__: 'concept' };
        if (['L_PAREN'].includes(this.__cToken__.type)) {
            this.__eat__(['L_PAREN']);
            node = this.definition();
            this.__eat__(['R_PAREN']);
        }
        else if (['L_ANGLE', 'L_SQBRACKET'].includes(this.__cToken__.type)) {
            node = this.conditional();
        }
        else if (['CASH'].includes(this.__cToken__.type)) {
            node = this.node_assign();
        }
        else {
            node = this.control_id();
        }
        return node;
    }
    node_assign() {
        let node = { __name__: 'node_assign' };
        this.__eat__(['CASH']);
        node.assign_node = this.__eat__(['id']);
        this.__eat__(['EQUAL']);
        node.value = this.id_or_string();
        this.__eat__(['CASH']);
        return node;
    }
    id_or_string() {
        let node = { __name__: 'id_or_string' };
        if (['literal'].includes(this.__cToken__.type)) {
            node.token = this.__eat__(['literal']);
        }
        else {
            node.token = this.__eat__(['id']);
        }
        return node;
    }
    conditional() {
        let node = { __name__: 'conditional' };
        node.cond = this.tokens();
        if (['IF'].includes(this.__cToken__.type)) {
            this.__eat__(['IF']);
            node.then = this.concept();
            if (['ELSE'].includes(this.__cToken__.type)) {
                this.__eat__(['ELSE']);
                node.else = this.concept();
            }
        }
        else {
            node = node.cond;
        }
        return node;
    }
    tokens() {
        let node = { __name__: 'tokens' };
        if (['L_SQBRACKET'].includes(this.__cToken__.type)) {
            node = this.token_list();
        }
        else {
            node = this.token_id();
        }
        return node;
    }
    token_id() {
        let node = { __name__: 'token_id' };
        this.__eat__(['L_ANGLE']);
        if (['NOT'].includes(this.__cToken__.type)) {
            this.__eat__(['NOT']);
            node.dont_eat = 'true';
        }
        node.token = this.__eat__(['id']);
        if (['COLON'].includes(this.__cToken__.type)) {
            node.property_name = this.property_assign();
        }
        this.__eat__(['R_ANGLE']);
        return node;
    }
    token_list() {
        let node = { __name__: 'token_list' };
        this.__eat__(['L_SQBRACKET']);
        if (['NOT'].includes(this.__cToken__.type)) {
            this.__eat__(['NOT']);
            node.dont_eat = 'true';
        }
        node.list = this.token_chain();
        if (['COLON'].includes(this.__cToken__.type)) {
            node.property_name = this.property_assign();
        }
        this.__eat__(['R_SQBRACKET']);
        return node;
    }
    token_chain() {
        let node = { __name__: 'token_chain' };
        node.tokens = [];
        node.tokens.push(this.token_id());
        while (['COMMA'].includes(this.__cToken__.type)) {
            this.__eat__(['COMMA']);
            node.tokens.push(this.token_id());
        }
        return node;
    }
    control_id() {
        let node = { __name__: 'control_id' };
        this.__eat__(['L_BRACKET']);
        node.token = this.__eat__(['id']);
        if (['COLON'].includes(this.__cToken__.type)) {
            node.property_name = this.property_assign();
        }
        this.__eat__(['R_BRACKET']);
        return node;
    }
    property_assign() {
        let node = { __name__: 'property_assign' };
        this.__eat__(['COLON']);
        node.token = this.__eat__(['id']);
        if (['L_SQBRACKET'].includes(this.__cToken__.type)) {
            this.__eat__(['L_SQBRACKET']);
            this.__eat__(['R_SQBRACKET']);
            node.is_list = 'true';
        }
        return node;
    }
}
exports.BNFyParser = BNFyParser;
//# sourceMappingURL=Parser.js.map