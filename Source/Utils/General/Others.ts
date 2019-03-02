export function PropNameToTitle(propName: string) {
	// demo string: somePropName
	return propName
		// somePropName -> some prop name
		.replace(/[A-Z]/g, a => ` ${a.toLowerCase()}`)
		// some prop name -> Some prop name
		.replace(/^./, a => a.toUpperCase());
}

export function EnumNameToDisplayName(enumName: string) {
	let result = enumName;
	result = result.replace(/[a-z][A-Z]+/g, (match) => {
		let result = `${match[0]} `;
		if (match.length == 2) {
			result += match[1].toLowerCase();
		} else {
			result += match.slice(1);
		}
		return result;
	});
	return result;
}
