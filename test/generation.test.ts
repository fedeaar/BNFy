// utils
import { expect } from 'chai';
// base
import { GeneratedParser } from '../src/main';
import { BNFTable, BNFGrammar } from '../src/bnf/grammar';
import { BNFInterpreter } from '../src/bnf/Interpreter';


describe('generate self', () => {

    it('check if the BNFParser can generate itself from its own grammar.', () => {
        const parser = new GeneratedParser(BNFGrammar, BNFTable); 
        const parserSource = parser.createParserSourceFile();
        const reiterationAST = parser.parse(BNFGrammar);
        const reiterationInterpreter = new BNFInterpreter(reiterationAST, BNFTable);
        const reiterationParserSource = parser.createParserSourceFile(reiterationInterpreter);
       
        expect(parserSource).is.equal(reiterationParserSource);
    });
});
