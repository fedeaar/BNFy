## BNFy.js

a simple bnf-like language for recursive descent AST parsers.

&nbsp;
## introductory example

Say we would like to solve some math input, something like:

```javascript
const input = " 1 + 2 * 3 ";
```

An overkill, but common, method (used for most, if not all, programming languages) would be to parse this `input` into an abstract syntax tree (AST), where each node represents some syntactical structure in the language (i.e. addition and multiplication in mathematical notation), and later interpret it.

A possible AST could be:

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

It can be thought of as the underlying structure of the `input`. 

Building these kind of structures is a fairly mechanical process that mainly requires you to create a proper syntax for the language. BNFy provides some tools to abstract away the implementation details of such a logic.

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
Based on the `grammar` and `table` provided, it will try to parse the source string and return a custom AST containing the structures defined by the grammar. Ill-formed source strings will raise an exception.

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

&nbsp;
- the `entry` modifier

    All grammars must prefix _one_ syntax declaration with the `entry` modifier. This modifier declares the main structure for the language and sets the entry point to be used by the parser's `parse` method.
    ```
	    entry mainSyntax ::= ... ;
   
    ```

&nbsp;
## Definitions

A definition is the RHS of a syntax declaration. It is an expression that states an expected sequence of terminals and non-terminals to be read during parsing.  

A simple definition could be:
```
	aFunction ::= 
        <alpha: name> 
        & {functionParameters: parameters} 
        & {functionBody: body} ;
```

This definition states: 

_the aFunction syntax is composed of an `alpha` terminal, to be stored as the `name` property in the corresponding AST node, followed by the non-terminal `functionParameters`, to be stored as `parameters`, and followed by the  non-terminal `functionBody`, to be stored as the `body`_.

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

    The property assignment operator tells BNFy that a `terminal` or `non-terminal` is relevant for later interpretation, therefore it should be stored in the AST object under the stated `name`. 

    For example:
    ```
    assignment ::= 
        <alpha: var> 
        & <ASSIGN_OP> 
        & {assignment_body: value};
    ```
    would produce the following node:
    ```javascript
    {
        __name__: "assignment", // a reference to the syntax's name.
        var: {  
            // the alpha terminal token object
            type: "alpha",
            value: ... ,
            position: ... 
        },
        value: {
            // the assignment_body non-terminal AST node
            __name__: "assignment_body",
            ...
        }
    }
    ```
    As of now, there is only one forbbiden property name: `__name__`. In general, try to avoid using 'dunder' naming conventions.  

&nbsp;
- the `[]` modifier

    Sometimes, it is more convenient to store some repeating pattern in an array, rather than to store it in a nested structure. The array modifier states that a property assignment (`:`) should produce an array and  that further passes through that terminal or non-terminal should push to that same array.

    For example, we may use:

    ```
    addition ::= <number: toAdd[]> + <PLUS> ;
    ```
    the `+` is the _repeat once or more_ operator. This definition means: 
    
    _Read a number and store it in the `toAdd` property array. While there is a plus token, read it, read a new number, and push the latter into `toAdd`_.

    We'll explain a bit more of the `+` operator further below.

&nbsp;
- the `!` modifier

    The _do not eat_ modifier allows for a `terminal` to be read but not processed. This helps to keep rules contained and is mainly useful with the `or` and `if` operators.

    For example:
    ```
        numbers ::=
            <number: value>
            |<!alpha> {constant: value};
        
        constant ::= <alpha: value>;
    ```
    the `|` is the _or_ operator. It will be explained further down. 
    
    This definition means:

    _Read a number and store it in `value` or, if the token to be read is an alpha, read a constant and store it in `value`._  

&nbsp;
- `Terminal Arrays`

    Terminal Arrays allow you to define a set of possible candidate terminals for the current step in the syntax. They are delimited by `[` and `]`, and hold the same operators and modifiers as any terminal.

    For example:
    ```
    [!<alpha>, <number> : value]
    ```   
    Note that terminal arrays will disregard individual terminal operators and modifiers, as they are expected to act as a single group. 


&nbsp;
## Operators

The following operators may be thought of as sequence controls. In order of precedence, they are:

- `choice`

    The highest precedence operator is the  _or_: `|` operator. It defines an option between a pair of terminals and / or non-terminals. The decision is based on the  next token to be processed. Therefore, a token or token array must be declared as the condition for the choice.

    The structure is `a` `|` `terminal condition` `b`.
    
    For example:
    ```
    factor ::= 
        <number: value>
        |<MINUS: operator> & <number: value>
        |<L_PAREN> {expression: value} & <R_PAREN> ;
    ```

&nbsp;
- `concatenation`

    Next is the  _and_: `&` operator. It concatenates a pair of terminals and / or non-terminals. 

    The structure is `a` `&` `b`.
    
    For example:
    ```
    addition ::= 
        <number : LHS> 
        & <PLUS: operator> 
        & <number: RHS>;
    ```

&nbsp;
- `repetition`

    Next are the `+` and `*` operators. They define, respectively, the _repeat 1 or more times_ and _repeat 0 or more times_ operators. Both need a condition to be met for repeating.

    The structure is `a` `+ or *` `terminal condition`.

    For example:

    ```
    addition ::= <number: toAdd[]> + <PLUS>;
    ```

&nbsp;
- `conditionals`
    The _if_: `?` and _else_: `->` operators define a conditional statement. The _else_ statement is optional.

    The structure is: `terminal condition` `?` `a` (`->` `b`).
    
    For example:
    ```
    additionOrSubstraction ::=
        <number: LHS>
        & <!PLUS> ?
            <PLUS: operator>
        ->
            <MINUS: operator>
        & <numbre: RHS> ;
    ```

&nbsp;
## Direct node assignment
Sometimes, it can be useful to assign literals or reassign already defined properties directly. This can be done through the `$` delimited property assignments.

The structure is: `$` `propertyName` `=` `literal or propertyName` `$`

The special propertyName `__node__` may be used to refer to the current node being constructed. In particular it may be used to replace the current node with one of its children.

For example:

```
entry expression ::=        
        {term: lNode} 
        & [<PLUS>, <MINUS>: operator] ? 
            {expression: rNode}
        -> 
            $ __node__ = lNode $;
```

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










