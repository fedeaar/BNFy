// Parser.ts defines a base class for Parser objects and AST nodes.

import { SyntaxError, ErrorCode } from './Errors';

import { Token } from './Token';
import { Lexer } from './Lexer';


/**
 * an AST-like node structure.
 */
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

	/**
	 * a base class for Parser objects.
	 */
	constructor() {}

	/**
	 * ensures the current token follow the expected underlying syntax.
	 * @param {string | string[]} tokenType the currently valid token types.
	 * @returns the evaluated token.
	 */
	protected __eat__(tokenType: string | string[]) : Token {
		if (!this.__cToken__ || !this.__nToken__ || !this.__lexer__) {
			throw new Error ('no lexer set for parsing.');
		}
		const eatString = typeof tokenType === 'string';
        const token = this.__cToken__;
		if ((eatString && this.__cToken__.type === tokenType) || 
			(!eatString && tokenType.includes(this.__cToken__.type))) {
			this.__cToken__ = this.__nToken__; 
			this.__nToken__ = this.__lexer__.nextToken();
		}
		else this.__error__(tokenType);
		return token;
	}

	/**
	 * handles error throwing.
	 * @param {string | string[]} expected the expected tokens. 
	 */
    protected __error__(expected: string | string[]): void {
		const error = new SyntaxError(
			ErrorCode.UNEXPECTED_TOKEN, 
			this.__cToken__, 
			`expected token type = ${expected}.`);
		throw new Error(error.msg);
	}

	protected __try__(fn: () => ParserNode): ParserNode | null {
		try {
			return fn();
		} catch(error) {
			//@ts-expect-error: error must have unknown or any type ?
			if (new RegExp(ErrorCode.UNEXPECTED_TOKEN).test(error.msg)) {
				return null;
			} else {
				throw error;
			}
		}
	}

	/**
	 * sets a new lexer for the parser.
	 * @param {Lexer} lexer the new lexer.
	 */
	protected set(lexer: Lexer): void {
		this.__lexer__ = lexer;
		this.__cToken__ = this.__lexer__.nextToken();
		this.__nToken__ = this.__lexer__.nextToken();
	}
}