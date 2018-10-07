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
		if (actionType == null) return false; // this can occur during start-up "assert reducer sanity" phase
		return this.type == actionType.name;
		//return this instanceof actionType; // alternative
	}
	IsAny(...actionTypes: (new(..._)=>Action<any>)[]) {
		return actionTypes.find(a=>this.type == a.name) != null;
	}
}