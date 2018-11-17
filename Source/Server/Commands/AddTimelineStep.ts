import { UserEdit } from 'Server/CommandMacros';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { TimelineStep } from '../../Store/firebase/timelineSteps/@TimelineStep';
import { Command } from '../Command';

@UserEdit
export class AddTimelineStep extends Command<{timelineID: number, step: TimelineStep}, {}> {
	stepID: number;
	timeline_oldSteps: number[];
	async Prepare() {
		const { timelineID, step } = this.payload;

		const lastStepID = await GetDataAsync('general', 'data', '.lastTimelineStepID') as number;
		this.stepID = lastStepID + 1;
		step.timelineID = timelineID;

		this.timeline_oldSteps = await GetDataAsync('timelines', timelineID, 'steps') || [];
	}
	async Validate() {
		const { step } = this.payload;
		AssertValidate('TimelineStep', step, 'TimelineStep invalid');
	}

	GetDBUpdates() {
		const { timelineID, step } = this.payload;
		const updates = {
			// add step
			'general/data/.lastTimelineStepID': this.stepID,
			[`timelineSteps/${this.stepID}`]: step,
			// add to timeline
			[`timelines/${timelineID}/steps`]: this.timeline_oldSteps.concat(this.stepID),
		} as any;
		return updates;
	}
}
