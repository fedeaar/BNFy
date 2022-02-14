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
	 * @param {number} i starting index value. Default = 0.
	 * @param {number} ln starting line value. Default = 1.
	 * @param {number} col starting column value. Default = 1.
	 */
	constructor (i: number = 0, ln: number = 1, col: number = 1) {
		this.i = i;
		this.ln = ln;
		this.col = col;
	}
	
	/** @returns {number} the current index */
	get index(): number {
		return this.i
	}

	/** @returns {position} all position coordinates: [index, line, column]. */
	get position(): position {
		return [this.i, this.ln, this.col];
	}

	/**
	 * advances the current position.
	 * @param {string} currentChar the current character of the text source.  
	 * @returns {number} the new index.
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