// Parser.ts defines a base class for Parser classes and AST nodes.

import { SyntaxError, ErrorCode } from './Errors';
import { Token } from './Token';
import { Lexer } from './Lexer';


/** an AST-like node structure. */
export interface ParserNode 
{
    __node__: string,
    [value: string]: any
}
export class BaseParser 
{
	protected __lexer__?: Lexer; 
	//@ts-expect-error: no explicit declaration of __cToken__.
	protected __cToken__: Token; 
	//@ts-expect-error: no explicit declaration of __nToken__.
	protected __nToken__: Token; 
	protected __raise_on_success__ = 0;

	/** a base class for Parser classes. */
	constructor() {}

	/**
	 * ensures the current token follows the expected underlying syntax.
	 * @param tokenType the currently valid token types.
	 * @returns the current token.
	 */
	protected __eat__(tokenType: string | string[]): Token {
		if (!this.__cToken__ || !this.__nToken__ || !this.__lexer__) {
			throw new Error ('no lexer set for parsing process.');
		}
		this.__expect__(tokenType);
		const token = this.__cToken__;
		this.__cToken__ = this.__nToken__; 
		this.__nToken__ = this.__lexer__.nextToken();
		return token;
	}

	protected __expect__(tokenType: string | string[]): void {
		const eatString = typeof tokenType === 'string';
		if ((eatString && this.__cToken__.type === tokenType) || 
			(!eatString && tokenType.includes(this.__cToken__.type))) {
				if (this.__raise_on_success__ > 0) {
					// alt functionality for __is__ scopes.
					throw "expected token found.";
				}
			return;
		} else {
			this.__error__(tokenType);
		}
	}

	protected __is__(fn: () => ParserNode): boolean {
		// a (pretty much illegal) exception driven flow control.
		// it detects whether the fn syntax would work or fail.
		try {
			++this.__raise_on_success__;
			fn();
			// should never happen.
			--this.__raise_on_success__;
			return true;
		} catch(error: any) {
			--this.__raise_on_success__;
			if (new RegExp("expected token found.").test(error)) {
				return true;
			} else {
				return false;
			}
		}
	}

	/**
	 * handles error throwing.
	 * @param expected the expected tokens. 
	 */
    protected __error__(expected: string | string[]): void {
		const error = new SyntaxError(
			ErrorCode.UNEXPECTED_TOKEN, 
			this.__cToken__, 
			`expected token type = ${expected}.`);
		throw new Error(error.msg);
	}

	/**
	 * sets a new lexer for the parser.
	 * @param lexer the new lexer.
	 */
	protected __set__(lexer: Lexer): void {
		this.__lexer__ = lexer;
		this.__cToken__ = this.__lexer__.nextToken();
		this.__nToken__ = this.__lexer__.nextToken();
	}
}