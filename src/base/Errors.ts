// Errors.ts handles Error definitions for the Lexing - Parsing - Interpeting process.

import { position } from "./Position";
import { Token } from "./Token";


/** the defined errors */
export enum ErrorCode 
{
	ILLEGAL_CHAR     = "invalid character.",
	UNEXPECTED_TOKEN = "unexpected token.", 
	TOKEN_ERROR      = "unknown or illegal token.",
	ID_NOT_FOUND     = "identifier not found.", 
	DUPLICATE_ID     = "duplicate identifier declaration.",
	MALFORMED_AST	 = "interpreter called on invalid AST structure.",
	NO_ENTRYPOINT    = "no entry point for parser declared in bnf source.",
	RESERVED_NAME	 = "reserved name."
}

export class baseError 
{
	protected errorcode?: ErrorCode; 
	protected token?: Token; 
	protected details?: string

	/**
	 * base error class for the Lexing - Parsing - Interpeting process.
	 * @param errorcode the error type.
	 * @param token the token where the error ocurred.
	 * @param details extra logging information.
	 */
	constructor (errorcode?: ErrorCode, token?: Token, details?: string) {
		this.errorcode = errorcode;
		this.token = token
		this.details = details
	}
	
	/** the error msg to display. */
	public get msg(): string {
		const info = this.token ? `\n\ttoken type = ${this.token.type}` : "";
		const value = this.token?.value ? `\n\tvalue = '${this.token.value}'` : "";
		const pos = this.token?.start ? `\n\tposition = [Line: ${this.token.start[1]}, Col: ${this.token.start[2]}]` : "";
		const details = this.details ? `\n\t${this.details}` : "";
		return `\t${this.constructor.name} - ${this.errorcode}${info}${value}${pos}${details}`;
	}
}


export class IllegalCharError extends baseError 
{	
	protected position: position;

	/**
	 * illegal character error class for the Lexing process.
	 * @param errorcode the error type.
	 * @param position where the error ocurred.
	 */
	constructor (errorcode: ErrorCode, position: position, details?: string) {
		super(errorcode);
		this.position = position;
		this.details = details;
	}

	/** the error msg to display. */
	public get msg() : string {
		const position = `\n\tposition = [Line: ${this.position[1]}, Col: ${this.position[2]}].`;
		return `${this.constructor.name}: ${this.errorcode}${position}\n\t${this.details}`;
	}
}

export class TokenError extends IllegalCharError {}
export class SyntaxError extends baseError {}
export class SemanticsError extends baseError {}