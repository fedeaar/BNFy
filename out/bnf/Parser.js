"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BNFParser = void 0;
const ParserBase_1 = require("../base/ParserBase");
class BNFParser extends ParserBase_1.ParserBase {
    constructor(lexer) {
        super(lexer);
        this.AST = this.parse();
    }
    parse() {
        return this.grammar();
    }
    grammar() {
        let node = { __name__: 'grammar' };
        node.statements = [];
        node.statements.push(this.statement());
        while (['SEMI'].includes(this.cToken.type)) {
            this.eat(['SEMI']);
            node.statements.push(this.statement());
        }
        this.eat(['__EOF__']);
        return node;
    }
    statement() {
        let node = { __name__: 'statement' };
        if (['id', 'MODIFIER'].includes(this.cToken.type)) {
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
        while (['MODIFIER'].includes(this.cToken.type)) {
            node.modifiers.push(this.eat(['MODIFIER']));
        }
        node.def_name = this.eat(['id']);
        node.operator = this.eat(['ASSIGN']);
        node.definition = this.definition();
        return node;
    }
    definition() {
        let node = { __name__: 'definition' };
        node.lNode = this.compound();
        if (['OR'].includes(this.cToken.type)) {
            this.eat(['OR']);
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
        if (['AND'].includes(this.cToken.type)) {
            this.eat(['AND']);
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
        if (['REPEAT_0N', 'REPEAT_1N'].includes(this.cToken.type)) {
            node.operator = this.eat(['REPEAT_0N', 'REPEAT_1N']);
            node.cond = this.tokens();
        }
        else {
            node = node.lNode;
        }
        return node;
    }
    concept() {
        let node = { __name__: 'concept' };
        if (['L_PAREN'].includes(this.cToken.type)) {
            this.eat(['L_PAREN']);
            node = this.definition();
            this.eat(['R_PAREN']);
        }
        else if (['L_ANGLE', 'L_SQBRACKET'].includes(this.cToken.type)) {
            node = this.conditional();
        }
        else if (['CASH'].includes(this.cToken.type)) {
            node = this.node_assign();
        }
        else {
            node = this.control_id();
        }
        return node;
    }
    node_assign() {
        let node = { __name__: 'node_assign' };
        this.eat(['CASH']);
        node.assign_node = this.eat(['id']);
        this.eat(['EQUAL']);
        node.value = this.id_or_string();
        this.eat(['CASH']);
        return node;
    }
    id_or_string() {
        let node = { __name__: 'id_or_string' };
        if (['literal'].includes(this.cToken.type)) {
            node.token = this.eat(['literal']);
        }
        else {
            node.token = this.eat(['id']);
        }
        return node;
    }
    conditional() {
        let node = { __name__: 'conditional' };
        node.cond = this.tokens();
        if (['IF'].includes(this.cToken.type)) {
            this.eat(['IF']);
            node.then = this.concept();
            if (['ELSE'].includes(this.cToken.type)) {
                this.eat(['ELSE']);
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
        if (['L_SQBRACKET'].includes(this.cToken.type)) {
            node = this.token_list();
        }
        else {
            node = this.token_id();
        }
        return node;
    }
    token_id() {
        let node = { __name__: 'token_id' };
        this.eat(['L_ANGLE']);
        if (['NOT'].includes(this.cToken.type)) {
            this.eat(['NOT']);
            node.dont_eat = 'true';
        }
        node.token = this.eat(['id']);
        if (['COLON'].includes(this.cToken.type)) {
            node.property_name = this.property_assign();
        }
        this.eat(['R_ANGLE']);
        return node;
    }
    token_list() {
        let node = { __name__: 'token_list' };
        this.eat(['L_SQBRACKET']);
        if (['NOT'].includes(this.cToken.type)) {
            this.eat(['NOT']);
            node.dont_eat = 'true';
        }
        node.list = this.token_chain();
        if (['COLON'].includes(this.cToken.type)) {
            node.property_name = this.property_assign();
        }
        this.eat(['R_SQBRACKET']);
        return node;
    }
    token_chain() {
        let node = { __name__: 'token_chain' };
        node.tokens = [];
        node.tokens.push(this.token_id());
        while (['COMMA'].includes(this.cToken.type)) {
            this.eat(['COMMA']);
            node.tokens.push(this.token_id());
        }
        return node;
    }
    control_id() {
        let node = { __name__: 'control_id' };
        this.eat(['L_BRACKET']);
        node.token = this.eat(['id']);
        if (['COLON'].includes(this.cToken.type)) {
            node.property_name = this.property_assign();
        }
        this.eat(['R_BRACKET']);
        return node;
    }
    property_assign() {
        let node = { __name__: 'property_assign' };
        this.eat(['COLON']);
        node.token = this.eat(['id']);
        if (['L_SQBRACKET'].includes(this.cToken.type)) {
            this.eat(['L_SQBRACKET']);
            this.eat(['R_SQBRACKET']);
            node.is_list = 'true';
        }
        return node;
    }
}
exports.BNFParser = BNFParser;
//# sourceMappingURL=Parser.js.map