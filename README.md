## BNFy.js

a simple bnf-like language for recursive descent AST parsers.

&nbsp;
## introductory example

Say we would like to solve some math input, something like:

```javascript
const input = " 1 + 2 * 3 ";
```

An overkill, but common, method (used for most, if not all, programming languages) would be to parse this `input` into an abstract syntax tree (AST), where each node represents some syntactical structure in the language (i.e. addition and multiplication in mathematical notation), and later interpret it.

A possible AST for our input could be:

```javascript
const AST = {
    "__node__": "expression",
    "lNode": {
        "__node__": "factor",
        "constant": {
            "__node__": "number",
            "token": {
                "type": "INTEGER_CONST",
                "value": "1"
            }
        }
    },
    "operator": {
        "type": "PLUS",
        "value": "+"
    },
    "rNode": {
        "__node__": "term",
        "lNode": {
            "__node__": "factor",
            "constant": {
                "__node__": "number",
                "token": {
                    "type": "INTEGER_CONST",
                    "value": "2"
                }
            }
        },
        "operator": {
            "type": "TIMES",
            "value": "*"
        },
        "rNode": {
            "__node__": "factor",
            "constant": {
                "__node__": "number",
                "token": {
                    "type": "INTEGER_CONST",
                    "value": "3"
                }
            }
        }
    }
}
```

It can be thought of as a graph that allows traversing the language in a sintactically relevant manner. 

Building these kind of structures is a fairly mechanical process that mainly requires you to create a proper syntax for the language and implement it through a parser. BNFy provides some tools to abstract away the implementation details of such a logic.

If you'd like to know how parsing (and much more) works under the hood, you might like [this series of posts](https://ruslanspivak.com/lsbasi-part1/).  

Let's jump on to what BNFy does.

&nbsp;
## GeneratedParser

BNFy defines one main class:

```javascript
	const parser = new GeneratedParser(grammar, table);
```

This class generates itself on initialization through a `grammar` source string and a `table` of token declarations.

It holds only one public method:
```javascript
	const source = ' 1 + 2 * 3 ';
	const AST = parser.parse(source);
```
Based on the `grammar` and `table` provided, it will try to parse the source string and return a custom AST containing the structures defined by the grammar. It will only try, as Ill-formed source strings will raise diferent kinds of exceptions.

&nbsp;
## BNFy's token table

(currently developed structure, subject to change)

A `token` is the basic unit of a language. It is composed of a specific string of characters and can be thought of as a `terminal`. BNFy defines five basic token structures that can be used to derive new tokens. These are:
- an `alpha`: a string of user defined _alpha_ and _number_ symbols that don't start with a _number_ .
- a `number`: a string of consecutive _number_ symbols that may include a floating point `.`.
- an `operator`: a string of user defined _operator_ symbols.
- a `delimiter`: a string of user defined _delimiter_ symbols.
- a `literal`: a continuous anything-goes-in string delimited by user defined _literal_ delimiter symbols.

It also defines some reserved names for certain tokens:
- `__REAL_CONST__`: used as the type for floating point `numbers` .
- `__INTEGER_CONST__`: used as the type for integer `numbers` .
- `__EOF__`: used as the type for the end of file token.

And some special names for the comment delimiters:
- `COMMENT_START`
- `COMMENT_END`
- `COMMENT_INLINE`

the `tokenTable` object holds this information. It is declared as follows:
```typescript
interface TokenTable
{
    terminals: {
        alpha: string,	    // what an alpha may be composed of.
        number: string,	    // what a number may be composed of.
        operator: string,	// what an operator may be composed of.
        delimiter: string,  // what a delimiter may be composed of.
        literal: string 	// what symbols delimit a literal.
    },
    skip: {
        whitespace: string	// what symbols are skipped. Intended for whitespaces.
    }
    reservedTypes : {
        __REAL_CONST__: string,	    // the id for the real const token.
        __INTEGER_CONST__: string,  // the id for the integer const token.
        __EOF__: string             // the id for the end of file token.
    },
    baseTypes: {
        alpha: string,	    // the id for the alpha base type.
        number: string,     // the id for the number base type.
        operator: string,   // the id for the operator base type.
        delimiter: string,  // the id for the delimiter base type.
        literal: string     // the id for the literal base type.
    },
    specialTypes: {
        COMMENT_START: string,	// the string that defines the start of a comment.
        COMMENT_END: string,    // the string that defines the end of a comment.
        COMMENT_INLINE: string  // the string that defines an inline comment.
    },
    compoundTypes: {
        [baseType in keyof TokenTable["baseTypes"]]: {
            // derived types from the baseTypes.
            [compoundType : string] : string | string[]
            // i.e. operator: { PLUS: '+' }
			// multiple matches may be defined for the same compound type.
        }
    }
}
```

When generating a new parser, you must define a structure like this one. Take the care to avoid overlapping rules.

&nbsp;
## BNFy's grammar
(currently developed syntax, subject to change)

A `grammar` is a source code written in BNFy's BNF-like language that defines the syntactical structures that can be parsed.

Here's a quick overview of the language:

&nbsp;
## Statements

- `syntax declarations`

    A grammar is composed of a set of syntax rule declarations that are structured as follows:
    ```
        aRule ::= ...  ;
    ```
    Syntax declarations are `;` delimited, have a `name` such as _aRule_ and    use the `::=` syntax assignment operator (the _is composed of_ operator).

    Because BNFy generates a parser object, certain names are forbidden, as they are already in use. These are: `parse`, `__set__`, `__eat__`,`__expect__`, `__is__`, `__error__`, `__lexer__`, `__cToken__`, `__nToken__`, `__raise_on_success__`, `__table__`, `__grammar__`, `__schema__`. 
    
    In general, try to avoid using dunder naming conventions.

&nbsp;
- the `entry` modifier

    All grammars must prefix one, and only one, syntax declaration with the `entry` modifier. This modifier declares that the following syntax declaration is the main structure of the language and sets the entry point to be used by the parser's `parse` method.
    ```
	    entry mainSyntax ::= ... ;
    ```

&nbsp;
## Definitions

A definition is the RHS of a syntax declaration. It is an expression that states an expected sequence of terminals and non-terminals to be read during parsing.  

A simple definition could be:
```
	aFunction ::= 
        <alpha: name> {functionParams: parameters} {functionBody: body} ;
```

This definition states: 

_the aFunction syntax is composed of an `alpha` terminal, to be stored as the `name` property in the corresponding AST node, followed by the non-terminal `functionParameters`, to be stored as `parameters`, and followed by the  non-terminal `functionBody`, to be stored as `body`_.

&nbsp;
## Terminals and Non-terminals

- `terminals`

    Terminals are references to the tokens declared in the `token table`. For example:
    
    ```
    <alpha>
    ```

    Terminals are composed of the token's `type` and are delimited by `<` and `>`.

&nbsp;
- `non-terminals`

    Non-terminals are references to other syntaxes in the grammar. For example:
    ```
    {anotherRule}
    ```
    Non terminals are composed of the syntax's `name` and are delimited by `{` and `}`. 

&nbsp;
- the `:` operator

    The property assignment operator, `:`, tells BNFy that a `terminal` or `non-terminal` is relevant for later interpretation, therefore it should be stored in the AST object under the stated `name`. 

    For example:
    ```
    assignment ::= 
        <alpha: var> <ASSIGN_OP> {assignment_body: value};
    ```
    would produce the following kind of node:
    ```javascript
    {
        __node__: "assignment", // a reference to the syntax's name.
        var: {  
            // the alpha terminal token object
            type: "alpha",
            value: ... ,
            position: ... 
        },
        value: {
            // the assignment_body non-terminal AST node
            __node__: "assignment_body",
            ...
        }
    }
    ```
    As of now, there is only one forbbiden property name: `__node__`. In general, try to avoid using 'dunder' naming conventions.  

&nbsp;
- the `[]` modifier

    Sometimes, it is more convenient to store some repeating pattern in an array, rather than to store it in a nested structure. The array modifier states that a property assignment (`:`) should produce an array and  that further passes through that terminal or non-terminal should push to that same array.

    For example, we may use:

    ```
    addition ::= <number: toAdd[]> (<PLUS> <number: toAdd[]>)* ;
    ```
    the `*` is the _repeat zero or more_ operator. This definition means: 
    
    _Read a number and store it in the `toAdd` property array. While there is a plus token, read it, read a new number, and push the latter into `toAdd`_.

    We'll explain a bit more of the `*` operator further below.

&nbsp;
- the `!` modifier

    The _do not eat_ modifier, `!`, allows for a `terminal` to be read but not processed. This may help on certain special cases.

    For example:
    ```
        empty_statement ::= {empty} <SEMI> ;
        empty ::= <!SEMI> ;
    ```

&nbsp;
- the `main` modifier

    The _main_ modifier, allows for a `non-terminal` to replace the current node being constructed if no other property assignments are made. 

    For example:
    ```
        unaryMinus ::= <MINUS: operator>^ {main factor: RHS}
    ```

    The `^` is the _repeat 0 or 1 time_ operator, it is explained further below.

    This statement can be read as follows: unaryMinus is composed of an optional `MINUS` token followed by a factor. The node to be constructed by this syntax holds the properties `operator` and `RHS`. If there is only a `RHS` property, replace this node by it.   

&nbsp;
- `Terminal Lists`

    Terminal Lists allow you to define a set of possible candidate terminals for the current step in the syntax. They follow the same syntax as a single terminal. 

    For example:
    ```
    <alpha, number: value>
    ```   

&nbsp;
## Operators

The following operators may be thought of as sequence controls. In order of precedence, they are:

- `choice`

    The highest precedence operator is the  _or_, `|`, operator. It defines an option between a pair of terminals and / or non-terminals. The decision is made implicitly on the  next token to be processed. Therefore if both options start with the same token, the first one will be chosen. 

    The structure is `a` `|` `b`.
    
    For example:
    ```
    factor ::= 
        <number: value>
        | <MINUS: operator> <number: value>
        | <L_PAREN> {expression: value} <R_PAREN> ;
    ```

    In particular, choices on non-terminals with no property assignments will omit themselves from the generated parser in favor of the chosen non-terminal. 

    For example:
    ```
        aBypassRule ::= {a} | {b} | {c} ;
    ``` 
    Will not generate a node for itself, but rather an `a`, `b` or `c` node.

&nbsp;
- `sequence`

    Next is the  _and_ implicit structure. It concatenates a pair of terminals and / or non-terminals. 

    The structure is `a` `b` `c` ...
    
    For example:
    ```
    term ::= 
        {factor : LHS} <TIMES, DIVISION: operator> {factor: RHS};
    ```

&nbsp;
- `repetition`

    Next are the `^`, `*` and `+` operators. They define, respectively, the _repeat 0 or 1 times_, _repeat 0 or more times_ and _repeat 1 or more times_ operators. The condition is checked against the first terminal or non-terminal in the LHS.   

    The structure is `a` `^, * or +`.

    For example:

    ```
    term ::= {factor : LHS} (<TIMES, DIVISION: operator> {term: RHS})*;
    ```

&nbsp;
- `conditionals`
    The _if_: `?` and _else_: `:` operators define a conditional statement. The _else_ statement is optional.

    The structure is: `a` `?` `b` `:` `c`.

    For example, for a mix between C-styled number literal type casting, and named constants we could define:
    ```
    constant ::=
        <number: constant> ? <alpha: type>^ : <alpha: constant>;
    ```
    such a rule would be able to parse:
    - numbers: _145.12_
    - typed numbers: _13.1F_
    - named constants: _pi_

    Most of the times, this operator can be replaced with other kinds of structures. 

&nbsp;
## Utils 

BNFy also defines a series of helper interfaces, functions and classes. I'll later make a proper documentation for them. These are:

```javascript

new BaseParser();   // base utils for the generated parsers.
new nodeVisitor(); // base utils for interpreter classes.

createParserSourceFile(schema); // creates the parser's source file from parser.__schema__
createInterpreterSourceFile(schema); // creates an interpreter source file base from parser.__schema__
createSourceFile(schema); // does both


```

and more.










