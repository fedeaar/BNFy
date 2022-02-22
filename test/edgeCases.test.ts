// utils
import { expect } from 'chai';
// base
import { createParserSourceFile, createSourceFile, GeneratedParser, GeneratedParserFromSchema } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy-0.0.2/grammar';
import { BNFyInterpreter } from '../src/BNFy-0.0.2/Interpreter';
import { saveFile } from '../src/Utils';
import { BNFyParser } from '../src/BNFy-0.0.2/Parser';
import { TokenTable } from '../src/base/Token';
import { CalcGrammar, CalcInterpreter, CalcTable } from './helpers/single_line_calculator.helper';

describe('check strange structures are properly parsed:', () => {
    describe('check if an almost single-line calculator grammar is properly parsed.', () => {
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