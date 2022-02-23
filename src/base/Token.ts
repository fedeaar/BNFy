// Token.ts defines the Token and TokenTable structures, and related functions. 

import { position } from "./Position"


export class Token 
{
	public type: string; 
    public start: position;
    public value?: string;

    /**
     * A token is the smallest significant unit inside a language.
     * @param type the type of the token.
     * @param start the starting position coordinates.
     * @param value the token's literal value.
     */
	constructor (type: string, start: position, value?: string) {
		this.type = type;
		this.value = value;
		this.start = start;
 	}

     /** @returns the string representation for this token. */
	public toString(): string {
		return this.value ?? `<Token: ${this.type}>`;
	}
}


/** defines the significant character terminals and token terminal types in the language. */
export interface TokenTable 
{
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
    reservedTypes: { 
        __REAL_CONST__: string;
        __INTEGER_CONST__: string;
        __EOF__: string;
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


/**
 * reduces the given table to its declared tokens.
 * @param table the TokenTable to reduce.
 * @returns an array of token identifiers.
 */
export function reduceTable(table: TokenTable): string[] {
    const reduced = [
        ...Object.values(table.reservedTypes), 
        ...Object.values(table.baseTypes),
        ...Object.values(table.specialTypes)
    ]
    for (let type in table.compoundTypes) {
        //@ts-expect-error: type is considered string rather than keyof TokenTable["baseTypes"]
        reduced.push(...Object.keys(table.compoundTypes[type]));
    }
    return reduced;
}