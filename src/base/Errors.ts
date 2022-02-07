import { position } from './Position';
import { Token } from './Token'

export enum ErrorCode {
	ILLEGAL_CHAR     = 'invalid character',
	UNEXPECTED_TOKEN = 'unexpected token', 
	ID_NOT_FOUND     = 'identifier not found', 
	DUPLICATE_ID     = 'duplicate identifier declaration'
}

export class slError {

	errorcode?: ErrorCode; 
	token?: Token; 
	details?: string

	constructor (errorcode?: ErrorCode, token?: Token, details?: string) {

		this.errorcode = errorcode;
		this.token = token
		this.details = details
	}
	
	public get msg(): string {

		const token_info = this.token? `\n\ttoken type = ${this.token.type}` : '';
		const token_value = this.token?.value? `\n\tvalue = '${this.token.value}'` : '';
		const token_pos = this.token?.start? `\n\tposition = [Line: ${this.token.start[1]}, Col: ${this.token.start[2]}]` : '';
		const details = this.details? `\n\t${this.details}` : '';
		return `\t${this.constructor.name} - ${this.errorcode}.${token_info}${token_value}${token_pos}${details}`;
	}
}

export class IllegalCharError extends slError {
	
	position: position;

	constructor (errorcode: ErrorCode, position: position) {
		super(errorcode);
		this.position = position;
	}

	public get msg() : string {

		return `${this.constructor.name}: ${this.errorcode}\n\tposition = [Line: ${this.position[1]}, Col: ${this.position[2]}]`;
	}
}


export class SyntaxError extends slError {}


export class SemanticsError extends slError {}