export type position = [number, number, number];


export class PositionHandler {

	protected i : number; 
	protected ln : number; 
	protected col : number;

	constructor (i : number = 0, ln : number = 1, col : number = 1) {

		this.i = i;
		this.ln = ln;
		this.col = col;
	}
	
	get index() : number {

		return this.i
	}

	get position() : position {

		return [this.i, this.ln, this.col];
	}

	public advance(currentChar? : string) : number {

		++this.i;
		if (currentChar === '\n') {
			++this.ln;
			this.col = 1;
		} 
		else {
			++this.col;
		} 
		return this.i;
	}
}