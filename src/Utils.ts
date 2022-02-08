import { readFileSync, writeFile } from "fs";

export function cleanStr(str : string) {
    return str.replace(/[#-}]/g, '\\$&');
}

export function replaceAll(str: string, searchValue: string, replaceValue: string): string {
	return str.replace(new RegExp(cleanStr(searchValue), 'g'), replaceValue);
}

export function isKeySubstring(test: string, obj: Object): boolean {
	const regex = new RegExp(`^${cleanStr(test)}`); 
	let res = false;
	for (let key in obj) {
		if (regex.test(key)) {
			res = true;
			break;
		};
	}
	return res;
}	

export type NestedArray<T> = T[] | NestedArray<T>[]
export function formatNestedString(str: NestedArray<string>, indent: number = 0) {
	let plainStr = "";
	for (let nest of str) {
		if (nest instanceof Array) {
			plainStr += formatNestedString(nest, indent + 1); 
		} else if (nest !== "") {
			plainStr += "\n" + "\t".repeat(indent) + nest; 
		}
	}
	return plainStr;
}

export function openFile(path : string) {	
	return readFileSync(path, 'utf8');
}

export function saveFile(path: string, content: string): void {
	writeFile(path, content, err => {
		if (err) {
			console.error(err);
		}
	});
}