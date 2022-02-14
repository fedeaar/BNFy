"use strict";
// ./bnf/Interpreter.ts interprets the BNFyParser's AST structure. It builds the base 
// structure used for generating new parsers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.BNFyInterpreter = void 0;
const Errors_1 = require("../base/Errors");
const Interpreter_1 = require("../base/Interpreter");
const Token_1 = require("../base/Token");
const Utils_1 = require("../Utils");
class BNFyInterpreter extends Interpreter_1.NodeVisitor {
    /**
     * BNFyInterpreter handles parser code generation and error checking for BNFy grammars.
     * @param {TokenTable} table the reference TokenTable for the grammar.
     */
    constructor(table) {
        super();
        this.controlIdentifiers = new Set();
        this.table = table;
        this.reducedTable = (0, Token_1.reduceTable)(table);
    }
    /**
     * main interpret method.
     * @param {ParserNode} BNFyAST a BNFyParser generated AST.
     * @returns {ParserSchema} the schema for the interpreted parser.
     */
    interpret(BNFyAST) {
        if (BNFyAST.__name__ !== "grammar")
            this.error(Errors_1.ErrorCode.MALFORMED_AST);
        this.controlIdentifiers.clear();
        const InterpretedParserSchema = this.visit(BNFyAST);
        return InterpretedParserSchema;
    }
    /* visit methods */
    visit_grammar(node) {
        const schema = {
            syntax: {},
            table: this.table
        }; // partial
        for (const statement of node.statements) {
            const syntax = this.visit(statement);
            if (syntax) {
                const literal = (0, Utils_1.formatNestedString)(syntax);
                schema.syntax[statement.def_name] = {
                    start: statement,
                    literal: literal,
                    fn: new Function(literal)
                };
                this.eval_modifiers(statement, schema);
            }
        }
        this.test_identifiers(schema);
        this.test_entryPoint(schema);
        return schema;
    }
    visit_statement(node) { }
    visit_empty(node) { }
    visit_define_stmnt(node) {
        const code = [
            `let node = {__name__: '${node.def_name}'};`,
            ...this.visit(node.definition),
            `return node;`
        ];
        return code;
    }
    visit_definition(node, cond) {
        const andNode = cond ?
            [
                `} else if (${this.visit(cond, false, false)}.includes(this.__cToken__.type)) {`,
                this.visit(cond),
                this.visit(node.lNode),
            ] : [
            '} else {',
            this.visit(node.lNode),
            '}'
        ];
        const code = node.rNode.__name__ === 'definition' ?
            [
                ...this.visit(node.rNode, node.cond),
                ...andNode
            ] : [
            `if (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,
            this.visit(node.cond),
            this.visit(node.rNode),
            ...andNode
        ];
        return code;
    }
    visit_compound(node) {
        const code = [
            ...this.visit(node.lNode),
            ...this.visit(node.rNode)
        ];
        return code;
    }
    visit_repetition(node) {
        const code = [
            ...this.visit(node.lNode, true, true, true, node.operator.type === 'REPEAT_1N'),
            `while (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,
            this.visit(node.cond),
            this.visit(node.lNode),
            `}`
        ];
        return code;
    }
    visit_concept(node) { }
    visit_node_assign(node) {
        let code = '';
        let assign = 'node.' + node.assign_node.value;
        if (assign === 'node.__node__')
            assign = 'node';
        if (node.value.token.type === 'literal') {
            code = `${assign} = ${this.visit(node.value)};`;
        }
        else {
            code = `${assign} = node.${this.visit(node.value)};`;
        }
        return [code];
    }
    visit_id_or_string(node) {
        return [node.token.value];
    }
    visit_conditional(node) {
        const code = [
            `if (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,
            this.visit(node.cond, true),
            this.visit(node.then)
        ];
        if (node.else) {
            code.push(`} else {`, this.visit(node.else), '}');
        }
        else {
            code.push('}');
        }
        return code;
    }
    visit_tokens(node) { }
    visit_token_id(node, dont_eat = true, full_stmnt = true, init = false, push = true) {
        this.test_token_id(node.token);
        let token_type = dont_eat && node.dont_eat ? '' : `['${node.token.value}']`;
        let code = token_type;
        if (full_stmnt) {
            if (token_type !== '') {
                code = `this.__eat__(${token_type})`;
                if (node.property_name) {
                    code = `${this.visit(node.property_name, code, init, push)}`;
                }
                else
                    code += ';';
            }
        }
        return [code];
    }
    visit_token_list(node, dont_eat = true, full_stmnt = true, init = false, push = true) {
        let token_list = dont_eat && node.dont_eat ? '' : `${this.visit(node.list, dont_eat)}`;
        if (token_list === '[]') {
            token_list = '';
        }
        let code = '';
        if (full_stmnt) {
            if (token_list !== '') {
                code = `this.__eat__(${token_list})`;
                if (node.property_name) {
                    code = `${this.visit(node.property_name, code, init, push)}`;
                }
                else
                    code += ';';
            }
        }
        else
            code = token_list;
        return [code];
    }
    visit_token_chain(node, dont_eat = true) {
        let code = '[';
        for (const token_id of node.tokens) {
            let token_repr = `${this.visit(token_id, dont_eat, false)}`;
            if (token_repr !== '') {
                code += token_repr.slice(1, -1) + ', ';
            }
        }
        code = code.slice(0, -2);
        code += ']';
        return [code];
    }
    visit_control_id(node, dont_eat = true, full_stmnt = true, init = false, push = true) {
        this.controlIdentifiers.add(node.token);
        let code = [`this.${node.token.value}()`];
        if (full_stmnt) {
            if (node.property_name) {
                code = this.visit(node.property_name, code[0], init, push);
            }
            else
                code = ['node = ' + code + ';'];
        }
        return code;
    }
    visit_property_assign(node, assign = '', init = false, push = true) {
        let code = [];
        if (node.is_list) {
            if (init) {
                code.push(`node.${node.token.value} = [];`);
            }
            if (push) {
                code.push(`node.${node.token.value}.push(${assign});`);
            }
        }
        else {
            code.push(`node.${node.token.value} = ${assign};`);
        }
        return code;
    }
    /* eval methods */
    eval_modifiers(node, schema) {
        for (const modifier of node.modifiers) {
            switch (modifier.value) {
                case 'entry':
                    if (schema.entryPoint) {
                        const detail = `entryPoint already defined for '${schema.entryPoint.toString()}' at ` +
                            `[ln: ${schema.entryPoint.start[1]}, col: ${schema.entryPoint.start[2]}].`;
                        this.error(Errors_1.ErrorCode.DUPLICATE_ID, detail, modifier);
                    }
                    else {
                        schema.entryPoint = node.def_name;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    /* test methods */
    test_token_id(token) {
        const name = token.toString();
        if (!this.reducedTable.includes(name)) {
            this.error(Errors_1.ErrorCode.ID_NOT_FOUND, `token not defined in table: ${name}`, token);
        }
    }
    test_identifiers(schema) {
        for (const identifier of this.controlIdentifiers) {
            const name = identifier.toString();
            if (!(name in schema.syntax)) {
                this.error(Errors_1.ErrorCode.ID_NOT_FOUND, `non-terminal not defined in grammar: ${name}`, identifier);
            }
        }
    }
    test_entryPoint(schema) {
        if (!schema.entryPoint) {
            this.error(Errors_1.ErrorCode.NO_ENTRYPOINT);
        }
    }
    error(type, detail, token) {
        let error = null;
        switch (type) {
            case Errors_1.ErrorCode.MALFORMED_AST:
                error = new Errors_1.SemanticsError(Errors_1.ErrorCode.MALFORMED_AST, undefined, "entry node is not 'grammar' in BNFyAST.");
                break;
            case Errors_1.ErrorCode.NO_ENTRYPOINT:
                error = new Errors_1.SemanticsError(Errors_1.ErrorCode.NO_ENTRYPOINT, undefined, "Use prefix `entry` to declare it in a syntax declaration.");
                break;
            case Errors_1.ErrorCode.ID_NOT_FOUND:
                error = new Errors_1.SemanticsError(Errors_1.ErrorCode.ID_NOT_FOUND, token, detail);
                break;
            case Errors_1.ErrorCode.DUPLICATE_ID:
                error = new Errors_1.SemanticsError(Errors_1.ErrorCode.DUPLICATE_ID, token, detail);
                break;
            default:
                break;
        }
        if (error)
            throw new Error(error.msg);
    }
}
exports.BNFyInterpreter = BNFyInterpreter;
//# sourceMappingURL=Interpreter.js.map