// utils
import { expect } from 'chai';
// base
import { createParserSourceFile, createSourceFile, GeneratedParser, GeneratedParserFromSchema } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy/grammar';
import { BNFyInterpreter } from '../src/BNFy/Interpreter';
import { saveFile } from '../src/Utils';
import { BNFyParser } from '../src/BNFy/Parser';
import { TokenTable } from '../src/base/Token';
import { CalcGrammar, CalcInterpreter, CalcTable } from './helpers/single_line_calculator.helper';

describe('check strange structures are properly parsed:', () => {
    
    it('should parse the calc tests on an almost single-line calculator grammar.', () => {
        const parser = new GeneratedParser(BNFyGrammar, BNFyTable);
        const ast = parser.parse(CalcGrammar);
        const schema = new BNFyInterpreter(CalcTable).interpret(ast);
        const p = new GeneratedParserFromSchema(schema);
        const i = new CalcInterpreter();

        let test = i.interpret(p.parse('5 + 4'));
        expect(test).is.equal(5 + 4);
    
        test = i.interpret(p.parse('5 + 4 / 3'));
        expect(test).is.equal(5 + 4/3);
    
        test = i.interpret(p.parse('5 + (4 - -2) * 7'));
        expect(test).is.equal(5 + (4 - -2) * 7); 
    
        test = i.interpret(p.parse('5 + -(4 - -(2*7 + 4 / (2 + 2 + 2 - (3)))) * 7'));
        expect(test).is.equal(5 + -(4 - -(2*7 + 4 / (2 + 2 + 2 - (3)))) * 7);    
    
        test = i.interpret(p.parse('|-2| + |-7*3/-2|/8'));
        expect(test).is.equal(Math.abs(-2) + Math.abs(-7*3/-2)/8); 
    
        test = i.interpret(p.parse('sin(|-2| + |-7*3/-2|/8)'));
        expect(test).is.equal(Math.sin(Math.abs(-2) + Math.abs(-7*3/-2)/8)); 
    
        test = i.interpret(p.parse('sin(|-2| + |-7*3/-2|/8) + pi*tan(pi) / ln(3*pi/2)'));
        expect(test).closeTo(
            Math.sin(Math.abs(-2) + Math.abs(-7*3/-2)/8) + Math.PI*Math.tan(Math.PI) / Math.log(3*Math.PI/2), 
            0.00000001
        );
    
        test = i.interpret(p.parse('min(sin(|-2| + |-7*3/-2|/8) + pi*tan(pi), |-2| + |-7*3/-2|/8)'));
        expect(test).closeTo(
            Math.min(
                Math.sin(Math.abs(-2) + Math.abs(-7*3/-2)/8) + Math.PI*Math.tan(Math.PI), 
                Math.abs(-2) + Math.abs(-7*3/-2)/8
            ), 0.00000001
        );
    
        test = i.interpret(p.parse('/* this */ 5 /* or */ + /* this */ 4 // nope'));
        expect(test).is.equal(5 + 4);
    });
});