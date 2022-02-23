import { ErrorCode, SemanticsError } from "../base/Errors";
import { NodeVisitor } from "../base/Interpreter";
import { ParserNode } from "../base/Parser";
import { Token } from "../base/Token";
import { NestedArray } from "../Utils";

export class DeclTable extends NodeVisitor {

    table: {
        [variable: string]: {
            refersTo: string,
            type: "terminal" | "non-terminal",
            isList: boolean,
            isMain: boolean
        }
    } = {}
    mainAssignment?: string;

	constructor (tree: ParserNode) {
		super();
        this.interpret(tree);
	}

	public interpret(tree: ParserNode) {
        if (tree.__node__ !== "declaration") {
            this.error(ErrorCode.MALFORMED_AST);
        }
		this.visit(tree);
        return this.table;
	}

    public stringify(): NestedArray<string> {
        const declTable = Object.keys(this.table);
        const parsed = [];
        for (let i = 0; i < declTable.length; ++i) {
            const declares = this.table[declTable[i]].isList ? "[]" : "null";
            const comma = i + 1 < declTable.length ? "," : "";
            parsed.push(`${declTable[i]}: ${declares}${comma}`);
        }
        return parsed;
    }

    public stringifyMainCondition(): NestedArray<string> {
        const parsed = [];
        if (this.mainAssignment) {
            let condition = "";
            const decls = Object.keys(this.table);
            for (let i = 0; i < decls.length; ++i) {
                if (decls[i] !== this.mainAssignment) {
                    condition += `!node.${decls[i]}${i + 1 < decls.length ? " && " : ""}`;
                }
            }
            parsed.push(`if (${condition}) {`,
                [`node = node.${this.mainAssignment};`],
            `}`);
        }
        return parsed;
    }

	protected visit_grammar(node: ParserNode) {
        for (const statement of node.statements) {
            this.visit(statement);
        }
    }

	protected visit_statement(node: ParserNode) {}

	protected visit_empty(node: ParserNode) {}

	protected visit_declaration(node: ParserNode) {
        this.visit(node.syntax);
    }

	protected visit_syntax(node: ParserNode) {
        this.visit(node.lNode);
        this.visit(node.rNode);
    }

	protected visit_sequence(node: ParserNode) {
        for (const element of node.sequence) {
            this.visit(element);
        }
    }

	protected visit_repetition(node: ParserNode) {
        this.visit(node.repeats);
    }

	protected visit_conditional(node: ParserNode) {
        this.visit(node.condition);
        this.visit(node.then);
        if (node.else) this.visit(node.else);
    }

	protected visit_identity(node: ParserNode) {}

	protected visit_terminal(node: ParserNode) {
        if (node.assigns) {
            this.table[node.assigns.name] = {
                refersTo: node.tokens.map((x: Token) => x.value),
                type: "terminal",
                ...this.visit(node.assigns)
            }
        }
    }

	protected visit_non_terminal(node: ParserNode) {
        if (node.assigns) {
            this.table[node.assigns.name.toString()] = {
                refersTo: [node.token.value],
                type: "non-terminal",
                ...this.visit(node.assigns)
            }
        }
        for (const modifier of node.modifiers) {
            if (modifier.value === "main") {
                this.set_main(node.assigns.name.toString(), modifier);
                break;
            }
        }
    }

	protected visit_property_assign(node: ParserNode) {
        const modifiers = node.modifiers.map((x: Token) => x.value);
        return {
            isList: modifiers.includes('[')
        }
    }

    protected set_main(name: string, token: Token) {
        if (!this.mainAssignment) {
            this.mainAssignment = name;
        } else {
            const error = new SemanticsError(
                ErrorCode.DUPLICATE_ID, 
                token, 
                "'main' declared twice for the same syntax.");
            throw new Error(error.msg);
        }
    }
}