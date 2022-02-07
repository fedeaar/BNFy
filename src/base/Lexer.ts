import { PositionHandler } from './Position'
import { Token, TokenTable, TokenBuilder, TokenBuilderCtx } from './Token'
import { IllegalCharError, ErrorCode } from './Errors';


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

		let pos = this.position.index;
		let peeked = this.text.slice(pos, pos + n);
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
				} else this.error();		
			}	
		}
		return new Token(this.builder.table.reservedTypes.EOF);
	}

	protected skipComment(endif: string): void {

		while (this.currentChar && 
			this.peek(endif.length) !== endif) {
			this.advance();
		}
		if (this.currentChar) this.advance(endif.length);
	}

	protected buildToken(generator: TokenBuilder): Token {

		let value : string = '';
		let start = this.position.position;
		while (this.currentChar) {
			if (generator.include(this.currentChar, value)) {
				value += this.currentChar;
				this.advance();
			}
			else break; 
		} 
		if (generator.raise(value)) {
			this.error();
		}
		return generator.return(value, start);
	}

	protected error(): void {

		const error = new IllegalCharError(ErrorCode.ILLEGAL_CHAR, this.position.position);
		throw new Error(error.msg); 
	}
}

