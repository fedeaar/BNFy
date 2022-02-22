import { NodeVisitor } from '../../src/base/Interpreter';
import { ParserNode } from '../../src/base/Parser';
import { TokenTable } from '../../src/base/Token'


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
        
    term ::=
        {main factor: lNode} (<TIMES, REAL_DIV: operator> {term: rNode})^ ;

    factor  ::= 
        {constant: constant}
        | {function: factor}
        | <MINUS: operator> {factor: factor}
        | <ABSOLUTE: operator> {expression: factor} <ABSOLUTE>
        | <L_PAREN> {expression: factor} <R_PAREN>;

    constant ::= <INTEGER_CONST, REAL_CONST, PI: token>;

    function ::=
        <id: name> <L_PAREN> {parameters: params} <R_PAREN>;

    parameters ::=
        ({expression: params[]} (<COMMA> {expression: params[]})*)^;
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
        const a  = this.visit(node.lNode);
        const b = this.visit(node.rNode);
        let ans = NaN;
        switch (node.operator.type) {
        case 'TIMES':
            ans = a * b;
            break;
        case 'REAL_DIV':
            ans = a / b;
            break; 
        }
        return ans;
    }

    visit_factor(node: ParserNode): number {
        let ans = NaN;
        if (node.constant) {
            ans = this.visit(node.constant);
        }
        else if (node.factor) {
            ans = this.visit(node.factor);
        }
        if (node.operator) {
            switch (node.operator.type) {
            case 'MINUS':
                ans = -ans;
                break;
            case 'ABSOLUTE':
                ans = Math.abs(ans);
            }
        }
        return ans;
    }

    visit_constant(node: ParserNode): number {
        let ans = node.token.value;
        switch (node.token.type) {
        case 'INTEGER_CONST':
            ans = parseInt(ans);
            break;
        case 'REAL_CONST':
            ans = parseFloat(ans);
            break;
        case 'PI':
            ans = Math.PI;
            break;
        default:
            const msg = `Semantics Error - no constant of type ${node.token.type} defined.`
            throw new Error(msg);   
        }
        return ans;
    }

    visit_function(node: ParserNode): number {
        let ans = NaN;
        const paramError = (n: number) => {
            const msg = 'syntax error, function called with wrong amount of parameters.';
            if (node.params.params.length !== n) throw new Error(msg);
        }
        const options = [];
        for (const parameter of node.params.params) {
            options.push(this.visit(parameter));
        }
        switch (node.name.value) {
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