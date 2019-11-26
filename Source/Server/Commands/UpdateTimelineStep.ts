import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import { AddSchema, AssertValidate, GetSchemaJSON, Schema } from 'Utils/FrameworkOverrides';
import {Command} from 'mobx-firelink';
import {GetAsync} from 'Utils/LibIntegrations/MobXFirelink';
import {GetTimelineStep} from 'Store/firebase/timelines';
import { UserEdit } from '../CommandMacros';

AddSchema('UpdateTimelineStep_payload', ['TimelineStep'], () => ({
	properties: {
		stepID: { type: 'string' },
		stepUpdates: Schema({
			properties: GetSchemaJSON('TimelineStep')['properties'].Including('title', 'message', 'groupID', 'videoTime', 'nodeReveals'),
		}),
	},
	required: ['stepID', 'stepUpdates'],
}));

@UserEdit
export class UpdateTimelineStep extends Command<{stepID: string, stepUpdates: Partial<TimelineStep>}, {}> {
	Validate_Early() {
		AssertValidate('UpdateTimelineStep_payload', this.payload, 'Payload invalid');
	}

	oldData: TimelineStep;
	newData: TimelineStep;
	async Prepare() {
		const { stepID, stepUpdates } = this.payload;
		this.oldData = await GetAsync(() => GetTimelineStep(stepID));
		this.newData = { ...this.oldData, ...stepUpdates };
	}
	async Validate() {
		AssertValidate('TimelineStep', this.newData, 'New timeline-step-data invalid');
	}

	GetDBUpdates() {
		const { stepID } = this.payload;
		const updates = {};
		updates[`timelineSteps/${stepID}`] = this.newData;
		return updates;
	}
}
