// utils
import { expect } from 'chai';
// base
import { GeneratedParser } from '../src/main';
import { BNFTable, BNFGrammar } from '../src/bnf/grammar';
import { BNFInterpreter } from '../src/bnf/Interpreter';
import { BNFParser } from '../src/bnf/Parser';
import { Lexer } from '../src/base/Lexer';
import { ErrorCode } from '../src/base/Errors';
import { throws } from 'assert';


describe('error catching', () => {

    it('should throw on illegal char errors.', () => {
        let grammar = '`'
        let lexer = new Lexer(grammar, BNFTable);

        expect(() => new BNFParser(lexer)).to.throw(Error, new RegExp(ErrorCode.ILLEGAL_CHAR));
    });
    it('should throw on unknown tokens.', () => {
        let grammar = 'entry test :::= <id>;'
        let lexer = new Lexer(grammar, BNFTable);
        expect(() => new BNFParser(lexer)).to.throw(Error, new RegExp(ErrorCode.TOKEN_ERROR));
    });
    it('should throw on unexpected tokens.', () => {
        let grammar = 'entry test ::= <id> <fire>;'
        let lexer = new Lexer(grammar, BNFTable);
        expect(() => new BNFParser(lexer)).to.throw(Error, new RegExp(ErrorCode.UNEXPECTED_TOKEN));
    });
    it('should throw on undefined non-terminals.', () => {
        let grammar = 'entry test ::= {unknown: x};';
        expect(() => new GeneratedParser(grammar, BNFTable)).to.throw(Error, new RegExp(ErrorCode.ID_NOT_FOUND));
    });
    it('should throw on undefined terminals.', () => {
        let grammar = 'entry test ::= <unknown: x>;';
        expect(() => new GeneratedParser(grammar, BNFTable)).to.throw(Error, new RegExp(ErrorCode.ID_NOT_FOUND));
    });
    it('should throw on repeated entry modifier.', () => {
        let grammar = 'entry test ::= <id>; entry nope ::= <id>;';
        expect(() => new GeneratedParser(grammar, BNFTable)).to.throw(Error, new RegExp(ErrorCode.DUPLICATE_ID));
    });
});
