// utils
import { expect } from 'chai';
// base
import { createParserSourceFile, createSourceFile, GeneratedParser, GeneratedParserFromSchema } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy/grammar';
import { BNFyInterpreter } from '../src/BNFy/Interpreter';
import * as calc1 from './helpers/calculator.helper'
import * as calc2 from './helpers/single_line_calculator.helper'
import { saveFile } from '../src/Utils';

describe('generate self:', () => {
    
    const parser = new GeneratedParser(BNFyGrammar, BNFyTable); 
    const parserSource = createParserSourceFile(parser.__schema__);

    it('check if the BNFParser can generate itself from its own grammar.', () => {
        const reiterationAST = parser.parse(BNFyGrammar);
        const reiterationInterpreter = new BNFyInterpreter(BNFyTable);
        const reiterationParserSource = createParserSourceFile(reiterationInterpreter.interpret(reiterationAST));
       
        expect(parserSource).is.equal(reiterationParserSource);
    });

    describe('check if the auto generation can parse the calculator grammar.', () => {

        it ('should parse the normal grammar.', () => {
            const parser = new GeneratedParser(BNFyGrammar, BNFyTable);
            const ast = parser.parse(calc1.CalcGrammar);
            const schema = new BNFyInterpreter(calc1.CalcTable).interpret(ast);
            const p = new GeneratedParserFromSchema(schema);
            const i = new calc1.CalcInterpreter();

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

        it ('should parse the single-line grammar.', () => {
            const parser = new GeneratedParser(BNFyGrammar, BNFyTable);
            const ast = parser.parse(calc2.CalcGrammar);
            const schema = new BNFyInterpreter(calc2.CalcTable).interpret(ast);
            const p = new GeneratedParserFromSchema(schema);
            const i = new calc2.CalcInterpreter();

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
});
