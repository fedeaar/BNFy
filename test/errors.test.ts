// utils
import { expect } from 'chai';
// base
import { GeneratedParser } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy/grammar';
import { BNFyInterpreter } from '../src/BNFy/Interpreter';
import { BNFyParser } from '../src/BNFy/Parser';
import { ErrorCode } from '../src/base/Errors';


describe('error catching:', () => {

    describe('for the lexer:', () => {
        it('should throw on illegal char errors.', () => {
            let grammar = '`';
            expect(() =>new BNFyParser(BNFyTable).parse(grammar)).to.throw(Error, new RegExp(ErrorCode.ILLEGAL_CHAR));
        });
        it('should throw on unknown tokens.', () => {
            let grammar = 'entry test :::= <id>;'
            expect(() =>new BNFyParser(BNFyTable).parse(grammar)).to.throw(Error, new RegExp(ErrorCode.TOKEN_ERROR));
        })
    });

    describe('for the parser:', () => {
        it('should throw on unexpected tokens.', () => {
            let grammar = 'entry test ::= <id> <unexpected>;'
            expect(() => new BNFyParser(BNFyTable).parse(grammar)).to.throw(Error, new RegExp(ErrorCode.UNEXPECTED_TOKEN));
        });
    });

    describe('for the interpreter:', () => {
        it('should throw on malformed ASTs.', () => {
            const interpreter = new BNFyInterpreter(BNFyTable);
            expect(() => interpreter.interpret({__name__: 'not_grammar'})).to.throw(Error, new RegExp(ErrorCode.MALFORMED_AST));
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
            let grammar = 'entry test ::= <id>; entry nope ::= <id>;';
            expect(() => new GeneratedParser(grammar, BNFyTable)).to.throw(Error, new RegExp(ErrorCode.DUPLICATE_ID));
        });
        it('should throw on no entry modifier.', () => {
            let grammar = 'test ::= <id>;';
            expect(() => new GeneratedParser(grammar, BNFyTable)).to.throw(Error, new RegExp(ErrorCode.NO_ENTRYPOINT));
        });
    });
});
