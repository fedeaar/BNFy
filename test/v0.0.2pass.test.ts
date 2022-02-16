// utils
import { expect } from 'chai';
// base
import { createParserSourceFile, createSourceFile, GeneratedParser, GeneratedParserFromSchema } from '../src/main';
import { BNFyTable, BNFyGrammar } from '../src/BNFy-0.0.2/grammar';
import { BNFyParser } from '../src/BNFy-0.0.2/Parser';
import { CalcTable, CalcGrammar, CalcInterpreter } from './calculator.helper'
import { saveFile } from '../src/Utils';

const parser = new BNFyParser(BNFyTable);
const ast = parser.parse(BNFyGrammar);

saveFile('ast.json', JSON.stringify(ast));