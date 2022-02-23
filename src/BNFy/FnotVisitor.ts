import { ErrorCode, SemanticsError } from "../base/Errors";
import { NodeVisitor } from "../base/Interpreter";
import { ParserNode } from "../base/Parser";
import { Token } from "../base/Token";
import { NestedArray } from "../Utils";

export class FnotVisitor extends NodeVisitor {

    cTerminals = new Set<string>();
    cNonTerminals = new Set<string>();
	constructor (tree: ParserNode) {
		super();
        if (["grammar", "declaration"].includes(tree.__node__)) {
            this.error(ErrorCode.MALFORMED_AST);
        }
        this.visit(tree);
	}

	public interpret(): string {
        let cTerminals = Array.from(this.cTerminals).toString();
        let fnot = "";
        if (cTerminals) {
            fnot = `[${cTerminals}].includes(this.__cToken__.type) || `;
        }
        for (const nTerminal of this.cNonTerminals) {
           fnot += `this.__is__(() => this.${nTerminal}()) || `;
        }
        fnot = fnot.slice(0, fnot.length - 4);
        return fnot;
	}

	protected visit_grammar(node: ParserNode) {}

	protected visit_statement(node: ParserNode) {}

	protected visit_empty(node: ParserNode) {}

	protected visit_declaration(node: ParserNode) {}

	protected visit_syntax(node: ParserNode) {
        this.visit(node.lNode);
        this.visit(node.rNode);
    }

	protected visit_sequence(node: ParserNode) {
        for (let i = 0; i < node.sequence.length; ++i) {
            const element = node.sequence[i];
            this.visit(element);
            if (((element.__node__ === "repetition" && element.operator.value !== "REPEAT_1N") 
                || element.__node__ === "conditional") && i + 1 < node.sequence.length) {
                continue;
            } else {
                break;
            }
        }
    }

	protected visit_repetition(node: ParserNode) {
        this.visit(node.repeats);
    }

	protected visit_conditional(node: ParserNode) {
        this.visit(node.condition);
    }

	protected visit_identity(node: ParserNode) {}

	protected visit_terminal(node: ParserNode) {
        for (const terminal of node.tokens.map((x: Token) => `"${x.value}"`)) {
            this.cTerminals.add(terminal);
        }
    }

	protected visit_non_terminal(node: ParserNode) {
        this.cNonTerminals.add(node.token.value);
    }

	protected visit_property_assign(node: ParserNode) {}
}