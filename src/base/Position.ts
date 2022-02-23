// Position.ts helps keep track of the index, line and column of the characters in a text source. 

/**  index, line and column values */
export type position = [number, number, number];

export class PositionHandler 
{
	protected i: number; 
	protected ln: number; 
	protected col: number;

	/**
	 * PositionHandler keeps track of position coordinates for characters in a text source.
	 * @param i starting index value. Default = 0.
	 * @param ln starting line value. Default = 1.
	 * @param col starting column value. Default = 1.
	 */
	constructor (i: number = 0, ln: number = 1, col: number = 1) {
		this.i = i;
		this.ln = ln;
		this.col = col;
	}
	
	/** @returns the current index */
	get index(): number {
		return this.i
	}

	/** @returns all position coordinates: [index, line, column]. */
	get position(): position {
		return [this.i, this.ln, this.col];
	}

	/**
	 * advances the current position.
	 * @param currentChar the current character being read.  
	 * @returns the new index.
	 */
	public advance(currentChar?: string): number {
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