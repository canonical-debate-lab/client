import { UserEdit } from "Server/CommandMacros";
import { Assert } from "js-vextensions";
import { GetDataAsync } from "../../Frame/Database/DatabaseHelpers";
import { Term } from "../../Store/firebase/terms/@Term";
import { Command } from "../Command";

@UserEdit
export default class UpdateTermData extends Command<{termID: number, updates: Partial<Term>}> {
	Validate_Early() {
		let {termID, updates} = this.payload;
		let allowedPropUpdates = ["name", "disambiguation", "type", "person", "shortDescription_current"];
		Assert(updates.VKeys().Except(...allowedPropUpdates).length == 0, `Cannot use this command to update props other than: ${allowedPropUpdates.join(", ")}`);
	}

	oldData: Term;
	newData: Term;
	async Prepare() {
		let {termID, updates} = this.payload;
		this.oldData = await GetDataAsync({addHelpers: false}, "terms", termID) as Term;
		this.newData = {...this.oldData, ...updates};
	}
	async Validate() {
		AssertValidate("Term", this.newData, `New-data invalid`);
	}
	
	GetDBUpdates() {
		let {termID} = this.payload;
		
		let updates = {
			[`terms/${termID}`]: this.newData,
		} as any;
		if (this.newData.name != this.oldData.name) {
			updates[`termNames/${this.oldData.name.toLowerCase()}/${termID}`] = null; 
			updates[`termNames/${this.newData.name.toLowerCase()}/${termID}`] = true; 
		}
		return updates;
	}
}