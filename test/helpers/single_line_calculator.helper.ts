import { NodeVisitor } from '../../src/base/Interpreter';
import { ParserNode } from '../../src/base/Parser';
import { Token, TokenTable } from '../../src/base/Token'


export const CalcTable : TokenTable = {
    terminals : {
        number: '0123456789',
        alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
        operator: '+*-/|',
        delimiter: `(),`,
        literal: ``
    },
    skip: {
        whitespace: ' \n\t\r',
    },
    reservedTypes: {
        __REAL_CONST__: 'REAL_CONST',
        __INTEGER_CONST__: 'INTEGER_CONST',
        __EOF__: '__EOF__'
    },
    baseTypes: {
        alpha: 'id',
        number: 'number',
        operator: 'operator',
        delimiter: 'delimiter',
        literal: 'literal'
    },
    specialTypes: {
        COMMENT_INLINE: '//',
        COMMENT_START: '/*',
        COMMENT_END: '*/'
    },
    compoundTypes: {
        alpha: {
            PI: 'pi'
        },
        number: {},
        operator: {
            TIMES: '*',
            REAL_DIV: '/',
            MINUS: '-',
            PLUS: '+',
            ABSOLUTE: '|'
        },
        delimiter : {
            L_PAREN : '(',
            R_PAREN : ')',
            COMMA: ','
        },
        literal : {}
    }
}


export const CalcGrammar = `
    entry expression ::=        
        {main term: lNode} (<PLUS, MINUS: operator> {expression: rNode})^ ;
    
    // please don't do this
    term ::= 
        <MINUS: factor_min_operator>^ (
            <INTEGER_CONST, REAL_CONST, PI: factor_constant>
            |   <id: factor_fn_name> <L_PAREN> (
                    {expression: factor_fn_params[]} (<COMMA> {expression: factor_fn_params[]})*
                )^ <R_PAREN>
            |   <ABSOLUTE: factor_abs_operator> {expression: factor} <ABSOLUTE>
            |   <L_PAREN> {expression: factor} <R_PAREN>
        ) 
        (<TIMES, REAL_DIV: term_operator> {term: rNode})^;
`;


export class CalcInterpreter extends NodeVisitor {


    visit_expression(node: ParserNode): number {
        const a  = this.visit(node.lNode);
        const b = this.visit(node.rNode);
        let ans = NaN;
        switch (node.operator.type) {
        case 'PLUS':
            ans = a + b;
            break;
        case 'MINUS':
            ans = a - b;
            break; 
        }
        return ans;
    }

    visit_term(node: ParserNode): number {
        const a  = this.eval_factor(node);
        let ans = a;
        if (node.rNode) {
            const b = this.visit(node.rNode);
            switch (node.term_operator.type) {
            case 'TIMES':
                ans = a * b;
                break;
            case 'REAL_DIV':
                ans = a / b;
                break; 
            }
        }
        return ans;
    }

    eval_factor(node: ParserNode): number {
        let ans = NaN;
        if (node.factor_constant) {
            ans = this.eval_constant(node.factor_constant);
         }
        else if (node.factor_fn_name) {
            ans = this.eval_fn(node);
        }
        if (node.factor) {
            ans = this.visit(node.factor);
        }
        if (node.factor_abs_operator) {
            ans = Math.abs(ans)
        }
        if (node.factor_min_operator) {
            ans = -ans;
        }
        return ans;
    }

    eval_constant(token: Token): number {
        let ans = NaN;
        let val = token.value;
        if (val) {
            switch (token.type) {
            case 'INTEGER_CONST':
                ans = parseInt(val);
                break;
            case 'REAL_CONST':
                ans = parseFloat(val);
                break;
            case 'PI':
                ans = Math.PI;
                break;
            default:
                const msg = `Semantics Error - no constant of type ${token.type} defined.`
                throw new Error(msg);   
            }
        }
        return ans;
    }

    eval_fn(node: ParserNode): number {
        let ans = NaN;
        const paramError = (n: number) => {
            const msg = 'syntax error, function called with wrong amount of parameters.';
            if (node.factor_fn_params.length !== n) throw new Error(msg);
        }
        const options = [];
        for (const parameter of node.factor_fn_params) {
            options.push(this.visit(parameter));
        }
        switch (node.factor_fn_name.value) {
        case 'sin':
            paramError(1);
            ans = Math.sin(options[0]);
            break;
        case 'cos':
            paramError(1);
            ans = Math.cos(options[0]);
            break;
        case 'tan':
            paramError(1);
            ans = Math.tan(options[0]);
            break;
        case 'log':
            paramError(1);
            ans = Math.log10(options[0]);
            break;
        case 'ln':
            paramError(1);
            ans = Math.log(options[0]);
            break;
        case 'min':
            ans = Math.min(...options);
            break;  
        case 'max':
            ans = Math.max(...options);
            break;
        default:
            const msg = `Semantics Error - no function ${node.name.value} defined.`
            throw new Error(msg);    
        }
        return ans;
    }
} 