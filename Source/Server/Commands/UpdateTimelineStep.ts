import { TimelineStep } from "Store/firebase/timelineSteps/@TimelineStep";
import { GetDataAsync } from "../../Frame/Database/DatabaseHelpers";
import { Command } from "../Command";
import { UserEdit } from "../CommandMacros";
import { GetSchemaJSON, WaitTillSchemaAddedThenRun } from "../Server";

WaitTillSchemaAddedThenRun("TimelineStep", ()=> {
	AddSchema({
		properties: {
			stepID: {type: "number"},
			stepUpdates: Schema({
				properties: GetSchemaJSON("TimelineStep").properties.Including("title", "message", "nodeReveals"),
			}),
		},
		required: ["stepID", "stepUpdates"],
	}, "UpdateTimelineStep_payload");
});

@UserEdit
export class UpdateTimelineStep extends Command<{stepID: number, stepUpdates: Partial<TimelineStep>}> {
	Validate_Early() {
		AssertValidate("UpdateTimelineStep_payload", this.payload, `Payload invalid`);
	}

	oldData: TimelineStep;
	newData: TimelineStep;
	async Prepare() {
		let {stepID, stepUpdates} = this.payload;
		this.oldData = await GetDataAsync({addHelpers: false}, "timelineSteps", stepID) as TimelineStep;
		this.newData = {...this.oldData, ...stepUpdates};
	}
	async Validate() {
		AssertValidate("TimelineStep", this.newData, `New timeline-step-data invalid`);
	}
	
	GetDBUpdates() {
		let {stepID} = this.payload;
		let updates = {};
		updates[`timelineSteps/${stepID}`] = this.newData;
		return updates;
	}
}