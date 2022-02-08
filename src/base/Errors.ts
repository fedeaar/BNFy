import { position } from './Position';
import { Token } from './Token';
import { ParserBase, ParserNode } from './ParserBase';


export enum ErrorCode {
	ILLEGAL_CHAR     = 'invalid character',
	UNEXPECTED_TOKEN = 'unexpected token', 
	TOKEN_ERROR      = 'unknown or illegal token',
	ID_NOT_FOUND     = 'identifier not found', 
	DUPLICATE_ID     = 'duplicate identifier declaration'
}

export class slError {

	protected errorcode?: ErrorCode; 
	protected token?: Token; 
	protected details?: string

	constructor (errorcode?: ErrorCode, token?: Token, details?: string) {
		this.errorcode = errorcode;
		this.token = token
		this.details = details
	}
	
	public get msg(): string {
		const info = this.token ? 
			`\n\ttoken type = ${this.token.type}` : 
			'';
		const value = this.token?.value ? 
			`\n\tvalue = '${this.token.value}'` : 
			'';
		const pos = this.token?.start ? 
			`\n\tposition = [Line: ${this.token.start[1]}, Col: ${this.token.start[2]}]` : 
			'';
		const details = this.details ? 
			`\n\t${this.details}` : 
			'';
		return `\t${this.constructor.name} - ${this.errorcode}.${info}${value}${pos}${details}`;
	}
}


export class IllegalCharError extends slError {
	
	protected position: position;

	constructor (errorcode: ErrorCode, position: position) {
		super(errorcode);
		this.position = position;
	}

	public get msg() : string {
		return `${this.constructor.name}: ${this.errorcode}\n\tposition = [Line: ${this.position[1]}, Col: ${this.position[2]}]`;
	}
}

export class TokenError extends IllegalCharError {}


export class SyntaxError extends slError {}


export class SemanticsError extends slError {}