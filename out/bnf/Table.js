"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.table = void 0;
exports.table = {
    terminals: {
        number: '0123456789',
        alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
        operator: '|:=?+*&!$<>-',
        delimiter: `(){}[],;`,
        literal: `'`
    },
    skip: {
        whitespace: ' \n\t\r',
    },
    reservedTypes: {
        REAL_CONST: 'REAL_CONST',
        INTEGER_CONST: 'INTEGER_CONST',
        EOF: 'EOF'
    },
    baseTypes: {
        alpha: 'id',
        number: 'number',
        operator: 'operator',
        delimiter: 'delimiter',
        literal: 'literal'
    },
    specialTypes: {
        COMMENT_INLINE: '//',
        COMMENT_START: '/*',
        COMMENT_END: '*/'
    },
    compoundTypes: {
        alpha: {
            MODIFIER: 'entryPoint'
        },
        number: {},
        operator: {
            OR: '|',
            AND: '&',
            NOT: '!',
            IF: '?',
            EQUAL: '=',
            CASH: '$',
            REPEAT_0N: '*',
            REPEAT_1N: '+',
            ASSIGN: '::=',
            COLON: ':',
            ELSE: '->',
            L_ANGLE: '<',
            R_ANGLE: '>'
        },
        delimiter: {
            L_PAREN: '(',
            R_PAREN: ')',
            L_BRACKET: '{',
            R_BRACKET: '}',
            L_SQBRACKET: '[',
            R_SQBRACKET: ']',
            COMMA: ',',
            SEMI: ';'
        },
        literal: {
            QUOTE: `'`
        }
    }
};
//# sourceMappingURL=Table.js.map