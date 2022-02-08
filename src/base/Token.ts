import { position } from "./Position"


export class Token {

	type: string; 
    start: position;
    value?: string;

	constructor (type: string, start: position, value?: string) {
		this.type = type;
		this.value = value;
		this.start = start;
 	}

	public toString(): string {
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


export function reduceTable(table: TokenTable) {
    const reduced = [
        ...Object.values(table.reservedTypes), 
        ...Object.values(table.baseTypes),
        ...Object.values(table.specialTypes)
    ]
    for (let type in table.compoundTypes) {
        //@ts-ignore
        reduced.push(...Object.keys(table.compoundTypes[type]));
    }
    return reduced;
}