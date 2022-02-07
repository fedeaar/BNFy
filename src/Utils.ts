import * as fs from 'fs';

export function isKeySubstring (test: string, obj: Object) 
{
	const regex = new RegExp(`^${cleanStr(test)}`) 
	for (let key in obj)
	{
		if (regex.test(key)) return true;
	}
	return false;
}	

export function cleanStr(str : string)
{
    return str.replace(/[#-}]/g, '\\$&')
}

export function pertenece(value : string, arr : string[]) : boolean
{
	for (let i = 0; i < arr.length; i++)
	{
		if (value == arr[i]) return true;
	}
	return false;
}

export function openFile(path : string)
{	
	return fs.readFileSync(path, 'utf8')
}

export function saveFile(path: string, content: string) {
	
	fs.writeFile(path, content, err => {
		if (err) {
			console.error(err);
		}
	});
}