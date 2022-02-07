import { position } from "./Position"
import * as Utils from "../Utils"


export class Token {

	type   : string; 
    value? : string;
    start? : position;

	constructor (type  : string, value? : string, start? : position) {

		this.type  = type;
		this.value = value;
		this.start = start;
 	}

	public toString() : string {

		return this.value ?? `<Token: ${this.type}>`;
	}
}


export interface TokenTable {

    terminals: { 
        alpha: string;
        number: string;
        operator: string;
        delimiter: string;
        literal: string;  
    },
    skip: {
        whitespace: string;
    }
    reservedTypes : { 
        REAL_CONST: string;
        INTEGER_CONST: string;
        EOF: string;
    },
    baseTypes: {
        alpha: string;
        number: string;
        operator: string;
        delimiter: string;
        literal: string;
    },
    specialTypes: {
        COMMENT_START: string;
        COMMENT_END: string;
        COMMENT_INLINE: string;
    },
    compoundTypes: {
        [baseType in keyof TokenTable["baseTypes"]]: {
            [compoundType : string] : string | string[];
        }
    }
}

type CompoundMap = {
    [baseType in keyof TokenTable["baseTypes"]]: {
        [compoundValue : string] : string;
    }
}

export interface TokenBuilder {

    include: (currentChar: string, currentValue: string) => boolean;
    return:  (value: string, start: position) => Token;  
    raise:   (formedValue: string) => boolean;
}

export class TokenBuilderCtx {

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
                type = this.table.reservedTypes.REAL_CONST;
            } else {
                type = this.table.reservedTypes.INTEGER_CONST;
            }
            return new Token(type, value, start);
        };
        
        const raiseFn = (formedValue: string): boolean => { 
            let times = 0;
            for (let i = 0; i < formedValue.length && times < 2; ++i) {
                if (formedValue[i] === '.') {
                    ++times;
                }
            }
            const raise = formedValue.length > 0 ? 
                (!this.table.terminals.alpha.includes(formedValue[formedValue.length - 1]) || times > 1):
                true;
            return raise;       
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
            const token = new Token(type, value, start);
            return token;
        };

        const raiseFn = (formedValue: string): boolean => {
            return Object.values(this.table.reservedTypes).includes(formedValue);
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
                include = Utils.isKeySubstring(currentValue + currentChar, this.compoundMap.operator);

            }
            return include;
        };

        const returnFn = (value: string, start: position): Token => {
            const token = new Token(this.compoundMap.operator[value], value, start);
            return token;
        };

        const raiseFn = (formedValue: string): boolean => { 
            return !(formedValue in this.compoundMap.operator);
        }

        const builder = {
            include: includeFn,
            return: returnFn,
            raise: raiseFn
        }
        return builder;
    }   

    private delimiterTokenBuilder() : TokenBuilder { 

        const includeFn = (currentChar: string, currentValue: string): boolean => { 
            return Utils.isKeySubstring(currentValue + currentChar, this.compoundMap.delimiter);
        };

        const returnFn = (value: string, start: position): Token => {
            const token = new Token(this.compoundMap.delimiter[value], value, start);
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
            let token = new Token(this.table.baseTypes.literal, value, start); 
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