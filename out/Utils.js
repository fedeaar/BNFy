"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = exports.openFile = exports.pertenece = exports.cleanStr = exports.isKeySubstring = void 0;
const fs = __importStar(require("fs"));
function isKeySubstring(test, obj) {
    const regex = new RegExp(`^${cleanStr(test)}`);
    for (let key in obj) {
        if (regex.test(key))
            return true;
    }
    return false;
}
exports.isKeySubstring = isKeySubstring;
function cleanStr(str) {
    return str.replace(/[#-}]/g, '\\$&');
}
exports.cleanStr = cleanStr;
function pertenece(value, arr) {
    for (let i = 0; i < arr.length; i++) {
        if (value == arr[i])
            return true;
    }
    return false;
}
exports.pertenece = pertenece;
function openFile(path) {
    return fs.readFileSync(path, 'utf8');
}
exports.openFile = openFile;
function saveFile(path, content) {
    fs.writeFile(path, content, err => {
        if (err) {
            console.error(err);
        }
    });
}
exports.saveFile = saveFile;
//# sourceMappingURL=Utils.js.map