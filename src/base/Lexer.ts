// Lexer.ts handles the identification of tokens during the parsing of a source string.

import { isKeySubstring } from '../Utils';
import { ErrorCode, IllegalCharError, TokenError } from './Errors';
import { position, PositionHandler } from './Position'
import { Token, TokenTable } from './Token'


export class Lexer 
{
	protected source: string; 
	protected table: TokenTable;
    // handlers
	protected builder: TokenBuilderCtx;
	protected position = new PositionHandler(-1, 1, 0); 
    // vars
	protected currentChar?: string; 

    /**
     * Handles the identification of tokens in a source string. 
     * @param {string} source a string to parse.
     * @param {TokenTable} table the possible tokens and allowed character terminals.
     */
	constructor (source: string, table: TokenTable) {
		this.source = source;
		this.table = table;
		this.builder = new TokenBuilderCtx(table);
		this.advance(); 
	}

    /**
     * advances the current character.
     * @param {number} n how many characters to advance.
     */
	protected advance(n: number = 1): void {
		while (n-- > 0) {
			this.position.advance(this.currentChar);
		}
		const pos = this.position.index;
		if (pos < this.source.length) {
			this.currentChar = this.source[pos];
		} else {
			this.currentChar = undefined;
		}	
	}
	
    /**
     * peeks into the source file. 
     * @param {mumber} n the amount of characters to peek at.
     * @returns {string} a substring of the source, from the current character to n (exclusive).
     */
	protected peek(n: number = 1): string {
		const pos = this.position.index;
		const peeked = this.source.slice(pos, pos + n);
		return peeked;
	}

    /**
     * tries to find the next valid token in the source string.
     * @returns {Token} the next token.
     */
    public nextToken(): Token {
		while (this.currentChar) {
			if (this.peek(this.table.specialTypes.COMMENT_START.length) === this.table.specialTypes.COMMENT_START) {
				this.skipComment(this.table.specialTypes.COMMENT_END);
			} else if (this.peek(this.table.specialTypes.COMMENT_INLINE?.length) === this.table.specialTypes.COMMENT_INLINE) {
				this.skipComment('\n');
			} else {
				const builder = this.builder.getBuilder(this.currentChar);
				if (builder) {
					if (builder === "skip") {
						this.advance();
					} else {
						return this.buildToken(builder);
					}
				} else this.error(ErrorCode.ILLEGAL_CHAR, this.position.position);		
			}	
		}
		return new Token(this.table.reservedTypes.__EOF__, this.position.position);
	}

    /**
     * builds and asserts the validity of the next token.
     * @param {TokenBuilder} generator the building rules for the expected token type.
     * @returns the built Token
     */
	protected buildToken(generator: TokenBuilder): Token {
		let value = '';
		const start = this.position.position;
		while (this.currentChar) {
			if (generator.include(this.currentChar, value)) {
				value += this.currentChar;
				this.advance();
			}
			else break; 
		} 
		if (generator.raise(value)) {
			this.error(ErrorCode.TOKEN_ERROR, start);
		}
		return generator.return(value, start);
	}

    /**
     * handles comment skipping.
     * @param {string} endif the skipping end condition.
     */
	protected skipComment(endif: string): void {
		while (this.currentChar && 
			this.peek(endif.length) !== endif) {
			this.advance();
		}
		if (this.currentChar) this.advance(endif.length);
	}

    /**
     * handles error throwing. 
     * @param {ErrorCode} type the type for the error. 
     * @param {position} position where it ocurred. 
     */
	protected error(type: ErrorCode, position: position): void {
		let error = null;
		switch (type) {
		case ErrorCode.TOKEN_ERROR:
			error = new TokenError(type, position);
			break;
		case ErrorCode.ILLEGAL_CHAR:
		default:
			error = new IllegalCharError(type, position);
			break;
		}
		throw new Error(error?.msg); 
	}
}


class TokenBuilderCtx 
{
    protected table : TokenTable; 
    protected compoundMap: CompoundMap;

    /**
     * TokenBuilderCtx handles assigning the correct building rules for Lexer.buildToken().
     * @param table the possible tokens and allowed character terminals.
     */
    constructor (table: TokenTable) {
        this.table = table;
        this.compoundMap = createCompoundMap(table.compoundTypes);
    }

    /**
     * assings a builder based on the current character being processed by the lexer. 
     * @param {string} currentChar the last read character.
     * @returns {TokenBuilder | "skip" | null} the builder, a "skip" command or a null 
     * value on failure to assign.
     */
    public getBuilder(currentChar: string): TokenBuilder | "skip" | null {
        let builder = null;
        if (this.table.skip.whitespace.includes(currentChar)) { // move to lexer
            builder = "skip";
        } else if (this.table.terminals.number.includes(currentChar)) {
            builder = this.numberTokenBuilder();
        } else if (this.table.terminals.alpha.includes(currentChar)) { 
            builder = this.wordTokenBuilder();
        } else if (this.table.terminals.operator.includes(currentChar)) { 
            builder = this.operatorTokenBuilder(); 
        } else if (this.table.terminals.delimiter.includes(currentChar)) { 
            builder = this.delimiterTokenBuilder();
        } else if (this.table.terminals.literal.includes(currentChar)) {
            builder = this.literalTokenBuilder();
        }
        //@ts-ignore: "skip" interpreted as string.
        return builder;
    }

    /**
     * @returns the build rules for a number token. 
     */
    protected numberTokenBuilder(): TokenBuilder { 
        const includeFn = (currentChar: string) : boolean => { 
            return this.table.terminals.number.includes(currentChar) || currentChar === '.'; 
        };
        const returnFn = (value: string, start: position): Token => {
            let type = null;
            if (value.includes('.')) {
                type = this.table.reservedTypes.__REAL_CONST__;
            } else {
                type = this.table.reservedTypes.__INTEGER_CONST__;
            }
            return new Token(type, start, value);
        };
        const raiseFn = (formedValue: string): boolean => { 
            let times = 0;
            for (let i = 0; i < formedValue.length && times < 2; ++i) {
                if (formedValue[i] === '.') {
                    ++times;
                }
            }
            return times > 1;       
        };  
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }

    /**
     * @returns the builder rules for a word token. 
     */
    protected wordTokenBuilder() : TokenBuilder {
        const includeFn = (currentChar: string): boolean => { 
            return (this.table.terminals.alpha.includes(currentChar) ||
                this.table.terminals.number.includes(currentChar)); 
        };
        const returnFn = (value: string, start: position): Token => {
            const type = value in this.compoundMap.alpha ? 
                this.compoundMap.alpha[value] : 
                this.table.baseTypes.alpha;    
            const token = new Token(type, start, value);
            return token;
        };
        const raiseFn = (formedValue: string): boolean => {
            return false;
        };
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        };
        return builder;
    }

    /**
     * @returns the builder rules for an operator token. 
     */
    private operatorTokenBuilder() : TokenBuilder {
        const includeFn = (currentChar: string, currentValue: string): boolean => { 
            let include = false;
            if (!(currentValue in Object.values(this.table.specialTypes))) {
                include = isKeySubstring(currentValue + currentChar, this.compoundMap.operator);
            }
            return include;
        };
        const returnFn = (value: string, start: position): Token => {
            const token = new Token(this.compoundMap.operator[value], start, value);
            return token;
        };
        const raiseFn = (formedValue: string): boolean => { 
            return !(formedValue in this.compoundMap.operator);
        };
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        }
        return builder;
    }   

    /**
     * @returns the builder rules for a delimiter token. 
     */
    private delimiterTokenBuilder() : TokenBuilder { 
        const includeFn = (currentChar: string, currentValue: string): boolean => { 
            return isKeySubstring(currentValue + currentChar, this.compoundMap.delimiter);
        };
        const returnFn = (value: string, start: position): Token => {
            const token = new Token(this.compoundMap.delimiter[value], start, value);
            return token;
        };
        const raiseFn = (): boolean => false;
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        }
        return builder;
    }

    /**
     * @returns the builder rules for a string literal token. 
     */
    private literalTokenBuilder() : TokenBuilder {
        const includeFn = (currentChar: string, currentValue: string): boolean => { 
            let include = true; 
            if (currentValue.length > 1) {
                include = currentValue[currentValue.length - 1] !== currentValue[0];
            }
            return include;
        };
        const returnFn = (value: string, start: position): Token => {
            let token = new Token(this.table.baseTypes.literal, start,  value); 
            return token;
        };
        const raiseFn = (): boolean => false;
        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        }
        return builder;
    }
}


type CompoundMap = {
    [baseType in keyof TokenTable["baseTypes"]]: {
        [compoundValue : string] : string;
    }
}
/** creates a compound map. */
function  createCompoundMap(compoundTypes: TokenTable["compoundTypes"]): CompoundMap {
    const compoundMap: any = {};
    for (const baseType in compoundTypes) {
        compoundMap[baseType] = {};
        //@ts-ignore: baseType interpreted as string.
        const baseTypeCompounds = compoundTypes[baseType];
        for (const type in baseTypeCompounds) {
            const value = baseTypeCompounds[type];
            if (typeof value === 'string') {
                compoundMap[baseType][value] = type;
            } else {
                for (const innerValue of value) {
                    compoundMap[baseType][innerValue] = type;
                }
            }
        }
    }
    return compoundMap as CompoundMap;
}

interface TokenBuilder 
{
    include: (currentChar: string, currentValue: string) => boolean;
    return: (value: string, start: position) => Token;  
    raise: (formedValue: string) => boolean;
}