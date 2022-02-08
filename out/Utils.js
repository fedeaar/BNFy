"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = exports.openFile = exports.formatNestedString = exports.isKeySubstring = exports.replaceAll = exports.cleanStr = void 0;
const fs_1 = require("fs");
function cleanStr(str) {
    return str.replace(/[#-}]/g, '\\$&');
}
exports.cleanStr = cleanStr;
function replaceAll(str, searchValue, replaceValue) {
    return str.replace(new RegExp(cleanStr(searchValue), 'g'), replaceValue);
}
exports.replaceAll = replaceAll;
function isKeySubstring(test, obj) {
    const regex = new RegExp(`^${cleanStr(test)}`);
    let res = false;
    for (let key in obj) {
        if (regex.test(key)) {
            res = true;
            break;
        }
        ;
    }
    return res;
}
exports.isKeySubstring = isKeySubstring;
function formatNestedString(str, indent = 0) {
    let plainStr = "";
    for (let nest of str) {
        if (nest instanceof Array) {
            plainStr += formatNestedString(nest, indent + 1);
        }
        else if (nest !== "") {
            plainStr += "\n" + "\t".repeat(indent) + nest;
        }
    }
    return plainStr;
}
exports.formatNestedString = formatNestedString;
function openFile(path) {
    return (0, fs_1.readFileSync)(path, 'utf8');
}
exports.openFile = openFile;
function saveFile(path, content) {
    (0, fs_1.writeFile)(path, content, err => {
        if (err) {
            console.error(err);
        }
    });
}
exports.saveFile = saveFile;
//# sourceMappingURL=Utils.js.map