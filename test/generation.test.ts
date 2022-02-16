// utils
import { expect } from 'chai';
// base
import { createParserSourceFile, createSourceFile, GeneratedParser, GeneratedParserFromSchema } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy-0.0.1/grammar';
import { BNFyInterpreter } from '../src/BNFy-0.0.1/Interpreter';
import { CalcTable, CalcGrammar, CalcInterpreter } from './calculator.helper'
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
        const parser = new GeneratedParser(BNFyGrammar, BNFyTable);
        const ast = parser.parse(CalcGrammar);
        const schema = new BNFyInterpreter(CalcTable).interpret(ast);
        const p = new GeneratedParserFromSchema(schema);
        const i = new CalcInterpreter();

        it ('should parse: 5 + 4', () => {
            let test = i.interpret(p.parse('5 + 4'));
            expect(test).is.equal(5 + 4);
        });
        it ('should parse: 5 + 4 / 3', () => {
            let test = i.interpret(p.parse('5 + 4 / 3'));
            expect(test).is.equal(5 + 4/3);
        });
        it ('should parse: 5 + (4 - -2) * 7', () => {
            let test = i.interpret(p.parse('5 + (4 - -2) * 7'));
            expect(test).is.equal(5 + (4 - -2) * 7); 
        });
        it ('should parse: 5 + -(4 - -(2*7 + 4 / (2 + 2 + 2 - (3)))) * 7', () => {
            let test = i.interpret(p.parse('5 + -(4 - -(2*7 + 4 / (2 + 2 + 2 - (3)))) * 7'));
            expect(test).is.equal(5 + -(4 - -(2*7 + 4 / (2 + 2 + 2 - (3)))) * 7);
        });    
        it ('should parse: |-2| + |-7*3/-2|/8', () => {
            let test = i.interpret(p.parse('|-2| + |-7*3/-2|/8'));
            expect(test).is.equal(Math.abs(-2) + Math.abs(-7*3/-2)/8);
        }); 
        it ('should parse: sin(|-2| + |-7*3/-2|/8)', () => {
            let test = i.interpret(p.parse('sin(|-2| + |-7*3/-2|/8)'));
            expect(test).is.equal(Math.sin(Math.abs(-2) + Math.abs(-7*3/-2)/8));
        }); 
        it ('should parse: sin(|-2| + |-7*3/-2|/8) + pi*tan(pi) / ln(3*pi/2)', () => {
            let test = i.interpret(p.parse('sin(|-2| + |-7*3/-2|/8) + pi*tan(pi) / ln(3*pi/2)'));
            expect(test).closeTo(
                Math.sin(Math.abs(-2) + Math.abs(-7*3/-2)/8) + Math.PI*Math.tan(Math.PI) / Math.log(3*Math.PI/2), 
                0.00000001
            );
        });
        it ('should parse: min(sin(|-2| + |-7*3/-2|/8) + pi*tan(pi), |-2| + |-7*3/-2|/8)', () => {
            let test = i.interpret(p.parse('min(sin(|-2| + |-7*3/-2|/8) + pi*tan(pi), |-2| + |-7*3/-2|/8)'));
            expect(test).closeTo(
                Math.min(
                    Math.sin(Math.abs(-2) + Math.abs(-7*3/-2)/8) + Math.PI*Math.tan(Math.PI), 
                    Math.abs(-2) + Math.abs(-7*3/-2)/8
                ), 0.00000001
            );
        });
        it ('should not parse comments like: /* this */ 5 /* or */ + /* this */ 4 // nope', () => {
            let test = i.interpret(p.parse('/* this */ 5 /* or */ + /* this */ 4 // nope'));
            expect(test).is.equal(5 + 4);
        });
    });
});
