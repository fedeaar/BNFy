import { TokenTable } from '../base/Token'


export const BNFTable : TokenTable = {
    terminals : {
        number: '0123456789',
        alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
        operator: '|:=?+*&!$<>-',
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
            MODIFIER: 'entry',
        },
        number: {},
        operator: {
            OR : '|',
            AND : '&',
            NOT : '!',
            IF  : '?',
            EQUAL : '=',
            CASH : '$',
            REPEAT_0N : '*',
            REPEAT_1N : '+',
            ASSIGN : '::=',
            COLON   : ':',
            ELSE : '->',
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


export const BNFGrammar = `
entry grammar ::= 
    {statement: statements[]} + <SEMI> & <__EOF__>;

statement ::= 
    {empty}
    |[!<id>, <MODIFIER>] {define_stmnt};

empty ::= 
    <!SEMI>;

define_stmnt ::= 
    <MODIFIER: modifiers[]> * <!MODIFIER> 
    & <id: def_name> 
    & <ASSIGN: operator> 
    & {definition: definition};

definition ::= 
    {compound: lNode} 
    & <OR> ? 
        ({tokens: cond} 
        & {definition: rNode}) 
    -> 
        $ __node__ = lNode $;

compound ::= 
    {repetition: lNode} 
    & <AND> ? 
        {compound: rNode} 
    -> 
        $ __node__ = lNode $;

repetition ::= 
    {concept : lNode} 
    & [<REPEAT_0N>, <REPEAT_1N>: operator] ? 
        {tokens : cond} 
    -> 
        $ __node__ = lNode $ ; 

concept ::= 
    {control_id} 
    |<!CASH> 
        {node_assign}
    |[!<L_ANGLE>, <L_SQBRACKET>] 
        {conditional} 
    |<L_PAREN> 
        {definition} 
        & <R_PAREN> ;

node_assign ::= 
    <CASH> 
    & <id: assign_node> 
    & <EQUAL> 
    & {id_or_string: value} 
    & <CASH>;

id_or_string ::= 
    <id: token> 
    |<!literal> 
        <literal: token>; 

conditional ::= 
    {tokens: cond} 
    & <IF> ? 
        ({concept: then} 
        & <ELSE> ? 
            {concept: else})
    ->
        $ __node__ = cond $;

tokens ::= 
    {token_id} 
    |<!L_SQBRACKET> 
        {token_list};

token_id ::= 
    <L_ANGLE> 
    & <NOT> ? 
        $ dont_eat = 'true' $ 
    & <id: token> 
    & <!COLON> ? 
        {property_assign: property_name} 
    & <R_ANGLE>;

token_list ::= 
    <L_SQBRACKET> 
    & <NOT> ? 
        $ dont_eat = 'true' $
    & {token_chain: list} 
    & <!COLON> ? 
        {property_assign: property_name}  
    & <R_SQBRACKET>;

token_chain ::= 
    {token_id : tokens[]} + <COMMA> ;

control_id ::= 
    <L_BRACKET> 
    & <id: token> 
    & <!COLON> ? 
        {property_assign: property_name} 
    & <R_BRACKET>;

property_assign ::= 
    <COLON> 
    & <id: token> 
    & <L_SQBRACKET> ?
        (<R_SQBRACKET>
        & $ is_list = 'true' $);
`;