import { isKeySubstring } from '../Utils';
import { position, PositionHandler } from './Position'
import { Token, TokenTable } from './Token'
import { ErrorCode, IllegalCharError, TokenError } from './Errors';


export class Lexer {

	text: string; 
	position = new PositionHandler(-1, 1, 0); 
	currentChar?: string; 
	builder: TokenBuilderCtx;
	table: TokenTable;

	constructor (text: string, table: TokenTable) {
		this.text = text;
		this.builder = new TokenBuilderCtx(table);
		this.table = table;
		this.advance(); 
	}

	protected advance(n: number = 1): void {
		while (n-- > 0) {
			this.position.advance(this.currentChar);
		}
		let pos = this.position.index;
		if (pos < this.text.length) {
			this.currentChar = this.text[pos];
		} else {
			this.currentChar = undefined;
		}	
	}
	
	protected peek(n: number = 1): string {
		const pos = this.position.index;
		const peeked = this.text.slice(pos, pos + n);
		return peeked;
	}

    public nextToken(): Token {
		while (this.currentChar) {
			if (this.peek(this.table.specialTypes.COMMENT_START.length) === this.table.specialTypes.COMMENT_START) {
				this.skipComment(this.table.specialTypes.COMMENT_END);
			} else if (this.peek(this.table.specialTypes.COMMENT_INLINE?.length) === this.table.specialTypes.COMMENT_INLINE) {
				this.skipComment('\n');
			}
			else {
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
		return new Token(this.builder.table.reservedTypes.__EOF__, this.position.position);
	}

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

	protected skipComment(endif: string): void {
		while (this.currentChar && 
			this.peek(endif.length) !== endif) {
			this.advance();
		}
		if (this.currentChar) this.advance(endif.length);
	}

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



type CompoundMap = {
    [baseType in keyof TokenTable["baseTypes"]]: {
        [compoundValue : string] : string;
    }
}


interface TokenBuilder {
    include: (currentChar: string, currentValue: string) => boolean;
    return: (value: string, start: position) => Token;  
    raise: (formedValue: string) => boolean;
}


class TokenBuilderCtx {

    public table : TokenTable; 
    protected compoundMap: CompoundMap;

    constructor(table: TokenTable) {
        this.table = table;
        this.compoundMap = this.setCompoundMap(table.compoundTypes);
    }

    public getBuilder(currentChar: string): TokenBuilder | "skip" | null {
        let builder = null;
        if (this.table.skip.whitespace.includes(currentChar)) {
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

    protected setCompoundMap(compoundTypes: TokenTable["compoundTypes"]): CompoundMap {
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