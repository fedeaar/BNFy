import { Token, TokenTable } from './Token';
import { Lexer } from './Lexer';
import { SyntaxError, ErrorCode } from './Errors';


export class ParserBase {

	lexer: Lexer; 
	table?: TokenTable; 
	cToken: Token; 
	nToken: Token; 

	constructor(lexer: Lexer, table?: TokenTable) {
		
		this.lexer = lexer;
		this.table = table;
		this.cToken = this.lexer.nextToken();
		this.nToken = this.lexer.nextToken();
	}

	protected eat(tokenType: string | string[]) : Token {
		
		const eatString = typeof tokenType === 'string';
        const token = this.cToken;
		if ((eatString && this.cToken.type === tokenType) || 
			(!eatString && tokenType.includes(this.cToken.type))) {
			this.cToken = this.nToken; // change to stack for n-items overlapping rules?
			this.nToken = this.lexer.nextToken();
		}
		else this.error(tokenType);
		return token;
	}

    protected error(expected: string | string[]): void {

		const error = new SyntaxError(ErrorCode.UNEXPECTED_TOKEN, this.cToken, `expected token type = ${expected}.`);
		throw new Error(error.msg);
	}
}