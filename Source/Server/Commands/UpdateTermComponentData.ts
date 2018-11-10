import { UserEdit } from "Server/CommandMacros";
import { Assert } from "js-vextensions";
import { GetDataAsync } from "../../Frame/Database/DatabaseHelpers";
import TermComponent from "../../Store/firebase/termComponents/@TermComponent";
import { Command } from "../Command";

@UserEdit
export default class UpdateTermComponentData extends Command<{termComponentID: number, updates: Partial<TermComponent>}> {
	Validate_Early() {
		let {termComponentID, updates} = this.payload;
		let allowedPropUpdates = ["text"];
		Assert(updates.VKeys().Except(...allowedPropUpdates).length == 0, `Cannot use this command to update props other than: ${allowedPropUpdates.join(", ")}`);
	}

	newData: TermComponent;
	async Prepare() {
		let {termComponentID, updates} = this.payload;
		let oldData = await GetDataAsync({addHelpers: false}, "termComponents", termComponentID) as TermComponent;
		this.newData = {...oldData, ...updates};
	}
	async Validate() {
		AssertValidate("TermComponent", this.newData, `New-data invalid`);
	}
	
	GetDBUpdates() {
		let {termComponentID} = this.payload;
		let updates = {
			[`termComponents/${termComponentID}`]: this.newData,
		};
		return updates;
	}
}