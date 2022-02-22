// utils
import { expect } from 'chai';
// base
import { GeneratedParser } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy-0.0.2/grammar';
import { BNFyInterpreter } from '../src/BNFy-0.0.2/Interpreter';
import { BNFyParser } from '../src/BNFy-0.0.2/Parser';
import { ErrorCode } from '../src/base/Errors';


describe('error catching:', () => {

    describe('for the lexer:', () => {
        it('should throw on illegal char errors.', () => {
            let grammar = '`';
            expect(() =>new BNFyParser(BNFyTable).parse(grammar)).to.throw(Error, new RegExp(ErrorCode.ILLEGAL_CHAR));
        });
        it('should throw on unknown tokens.', () => {
            let grammar = 'entry test :::= <alpha>;'
            expect(() =>new BNFyParser(BNFyTable).parse(grammar)).to.throw(Error, new RegExp(ErrorCode.TOKEN_ERROR));
        })
    });

    describe('for the parser:', () => {
        it('should throw on unexpected tokens.', () => {
            let grammar = 'entry test ::= ;'
            expect(() => new BNFyParser(BNFyTable).parse(grammar)).to.throw(Error, new RegExp(ErrorCode.UNEXPECTED_TOKEN));
        });
    });

    describe('for the interpreter:', () => {
        it('should throw on malformed ASTs.', () => {
            const interpreter = new BNFyInterpreter(BNFyTable);
            expect(() => interpreter.interpret({__node__: 'not_grammar'})).to.throw(Error, new RegExp(ErrorCode.MALFORMED_AST));
        });
        it('should throw on undefined non-terminals.', () => {
            let grammar = 'entry test ::= {unknown: x};';
            expect(() => new GeneratedParser(grammar, BNFyTable)).to.throw(Error, new RegExp(ErrorCode.ID_NOT_FOUND));
        });
        it('should throw on undefined terminals.', () => {
            let grammar = 'entry test ::= <unknown: x>;';
            expect(() => new GeneratedParser(grammar, BNFyTable)).to.throw(Error, new RegExp(ErrorCode.ID_NOT_FOUND));
        });
        it('should throw on repeated entry modifier.', () => {
            let grammar = 'entry test ::= <alpha>; entry nope ::= <alpha>;';
            expect(() => new GeneratedParser(grammar, BNFyTable)).to.throw(Error, new RegExp(ErrorCode.DUPLICATE_ID));
        });
        it('should throw on no entry modifier.', () => {
            let grammar = 'test ::= <alpha>;';
            expect(() => new GeneratedParser(grammar, BNFyTable)).to.throw(Error, new RegExp(ErrorCode.NO_ENTRYPOINT));
        });
    });
});
