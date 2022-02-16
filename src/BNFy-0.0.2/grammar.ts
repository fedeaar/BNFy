// grammar.ts declares the grammar and TokenTable for the BNFyParser.

import { TokenTable } from '../base/Token'


export const BNFyTable: TokenTable = {
    terminals : {
        number: '0123456789',
        alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
        operator: '|:=?+*!<>-^',
        delimiter: `(){}[],;`,
        literal: `'`
    },
    skip: {
        whitespace: ' \n\t\r',
    },
    reservedTypes: {
        __REAL_CONST__: '__REAL_CONST__',
        __INTEGER_CONST__: '__INTEGER_CONST__',
        __EOF__: '__EOF__'
    },
    baseTypes: {
        alpha: 'alpha',
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
            D_MODIFIER: 'entry',
            P_MODIFIER: 'main'
        },
        number: {},
        operator: {
            OR : '|',
            AND : '&',
            NOT : '!',
            IF  : '?',
            EQUAL : '=',
            REPEAT_01 : '^',
            REPEAT_0N : '*',
            REPEAT_1N : '+',
            ASSIGN : '::=',
            COLON   : ':',
            L_ANGLE : '<',
            R_ANGLE : '>'
        },
        delimiter : {
            L_PAREN : '(',
            R_PAREN : ')',
            L_BRACKET : '{',
            R_BRACKET : '}',
            L_SQBRACKET : '[',
            R_SQBRACKET : ']',
            COMMA   : ',',
            SEMI    : ';'
        },
        literal : {
            QUOTE   : `'`
        }
    }
}


export const BNFyGrammar = `
entry grammar ::= 
    ({statement: statements[]} <SEMI>)* 
    <__EOF__>;

statement ::= 
    {empty} | {declaration};

empty ::= <!SEMI>;

declaration ::= 
    <D_MODIFIER: modifiers[]>* 
    <alpha: name> 
    <ASSIGN>
    {syntax: definition} ;

syntax ::= 
    {sequence: main lNode} 
    (<OR> {syntax: rNode})^ ;

sequence ::= 
    {repetition: main sequence[]}+ ;

repetition ::= 
    {conditional: main repeats} 
    <REPEAT_01, REPEAT_0N, REPEAT_1N: operator>^ ;

conditional ::= 
    {identity: main condition} 
    (<IF> {syntax: then} 
        (<COLON> {syntax: else})^ 
    )^ ;

identity ::= 
    {terminal} | {non_terminal} | <L_PAREN> {syntax} <R_PAREN> ;

terminal ::= 
    <L_ANGLE> 
    <NOT: dont_eat>^ 
    <alpha: tokens[]> (<COMMA> <alpha: tokens[]>)* 
    {property_assign: property_name}^ 
    <R_ANGLE> ; 

non_terminal ::= 
    <L_BRACKET> 
    <alpha: token> 
    {property_assign: property_name}^ 
    <R_BRACKET> ;

property_assign ::= 
    <COLON> 
    <P_MODIFIER: modifiers[]>* 
    <alpha: name>
    (<L_SQBRACKET: modifiers[]> <R_SQBRACKET>)^ ;
`;
