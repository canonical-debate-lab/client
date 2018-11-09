export class Action<Payload> {
	constructor(payload: Payload) {
		this.type = this.constructor.name;
		this.payload = payload;
		// have this inherit from the base object prototype
		Object.setPrototypeOf(this, Object.getPrototypeOf({}));
	}
	type: string;
	payload: Payload; // needed for Is() method's type-inference to work, for some reason

	Is<Payload2>(actionType: new(..._)=>Action<Payload2>): this is Action<Payload2> {
		if (actionType == null) return false; // this can occur during start-up 'assert reducer sanity' phase
		return this.type === actionType.name;
		// return this instanceof actionType; // alternative
	}
	IsAny(...actionTypes: (new(..._)=>Action<any>)[]) {
		return actionTypes.find(a => this.type === a.name) != null;
	}
}

export function IsACTSetFor(action: Action<any>, path: string) {
	if (!action.type.startsWith("ACTSet_")) return false;
	// exact match
	if (action.payload["path"] == path) return true;
	// wildcard match
	if (path.includes("$any")) {
		let pathParts = path.split("/");
		let actionPathParts = action.payload["path"].split("/");
		for (let [index, pathPart] of pathParts.entries()) {
			let matches = pathPart == actionPathParts[index] || pathPart == "$any";
			if (!matches) return false;
		}
		return true;
	}
	return false;
}