"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BNFInterpreter = void 0;
const Errors_1 = require("../base/Errors");
const Interpreter_1 = require("../base/Interpreter");
const Token_1 = require("../base/Token");
const Utils_1 = require("../Utils");
class BNFInterpreter extends Interpreter_1.NodeVisitor {
    constructor(tree, table) {
        super();
        this.generatedParserTree = {};
        this.control_identifiers = new Set();
        this.tree = tree;
        this.table = (0, Token_1.reduceTable)(table);
        this.interpret();
        this.test_identifiers();
    }
    interpret() {
        this.visit(this.tree);
        return this.generatedParserTree;
    }
    visit_grammar(node) {
        for (const statement of node.statements) {
            this.visit(statement);
        }
    }
    visit_statement(node) { }
    visit_empty(node) { }
    visit_define_stmnt(node) {
        const code = [
            `let node = {__name__: '${node.def_name}'};`,
            ...this.visit(node.definition),
            `return node;`
        ];
        const text = (0, Utils_1.formatNestedString)(code);
        this.generatedParserTree[node.def_name] = {
            start_node: node,
            literal: text,
            fn: new Function(text)
        };
        this.eval_modifiers(node);
    }
    visit_definition(node, cond) {
        let code = [];
        if (cond) {
            code = [
                `else if (${this.visit(cond, false, false)}.includes(this.__cToken__.type)) {`,
                this.visit(cond),
                this.visit(node.lNode),
                `}`
            ];
        }
        else {
            code = [
                'else {',
                this.visit(node.lNode),
                '}'
            ];
        }
        if (node.rNode.__name__ === 'definition') {
            code = [
                ...this.visit(node.rNode, node.cond),
                ...code
            ];
        }
        else {
            code = [
                `if (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,
                this.visit(node.cond),
                this.visit(node.rNode),
                `}`,
                ...code
            ];
        }
        return code;
    }
    visit_compound(node) {
        let code = [
            ...this.visit(node.lNode),
            ...this.visit(node.rNode)
        ];
        return code;
    }
    visit_repetition(node) {
        const oneOrMore = node.operator.type === 'REPEAT_1N';
        let code = [
            ...this.visit(node.lNode, true, true, true, oneOrMore),
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
        let code = [
            `if (${this.visit(node.cond, false, false)}.includes(this.__cToken__.type)) {`,
            this.visit(node.cond, true),
            this.visit(node.then),
            `}`
        ];
        if (node.else) {
            code.push(`else {`, this.visit(node.else), '}');
        } /* else code += ' '; */
        return code;
    }
    visit_tokens(node) { }
    visit_token_id(node, dont_eat = true, full_stmnt = true, init = false, push = true) {
        this.test_token_id(node.token);
        let token_type = '';
        if (dont_eat && node.dont_eat) {
            token_type = '';
        }
        else {
            token_type = `['${node.token.value}']`;
        }
        let code = '';
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
        else
            code = token_type;
        return [code];
    }
    visit_token_list(node, dont_eat = true, full_stmnt = true, init = false, push = true) {
        let token_list = '';
        if (!(dont_eat && node.dont_eat)) {
            token_list = `${this.visit(node.list, dont_eat)}`;
            if (token_list === '[]')
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
        for (let token_id of node.tokens) {
            let token_repr = `${this.visit(token_id, dont_eat, false)}`;
            if (token_repr != '')
                code += token_repr.slice(1, -1) + ', ';
        }
        code = code.slice(0, -2);
        code += ']';
        return [code];
    }
    visit_control_id(node, dont_eat = true, full_stmnt = true, init = false, push = true) {
        this.control_identifiers.add(node.token);
        let code = [`this.${node.token.value}()`];
        if (full_stmnt) {
            if (node.property_name) {
                code = this.visit(node.property_name, code, init, push);
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
    eval_modifiers(node) {
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                switch (modifier.value) {
                    case 'entry':
                        if (this.entryPoint) {
                            const error = new Errors_1.SemanticsError(Errors_1.ErrorCode.DUPLICATE_ID, modifier, `entryPoint already defined for '${this.entryPoint.toString()}' at ` +
                                `[ln: ${this.entryPoint.start[1]}, col: ${this.entryPoint.start[2]}].`);
                            throw new Error(error.msg);
                        }
                        else {
                            this.entryPoint = node.def_name;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }
    test_token_id(token) {
        if (!this.table.includes(token.toString())) {
            const error = new Errors_1.SemanticsError(Errors_1.ErrorCode.ID_NOT_FOUND, token, `token not defined in table: ${token}`);
            throw Error(error.msg);
        }
    }
    test_identifiers() {
        for (const identifier of this.control_identifiers) {
            if (!(identifier.toString() in this.generatedParserTree)) {
                const error = new Errors_1.SemanticsError(Errors_1.ErrorCode.ID_NOT_FOUND, identifier, `non terminal not defined in grammar: ${identifier}`);
                throw Error(error.msg);
            }
        }
    }
}
exports.BNFInterpreter = BNFInterpreter;
//# sourceMappingURL=Interpreter.js.map