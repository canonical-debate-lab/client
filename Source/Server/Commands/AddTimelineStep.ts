import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import {GetDataAsync} from 'Utils/FrameworkOverrides';
import { TimelineStep } from '../../Store/firebase/timelineSteps/@TimelineStep';
import { Command } from 'Utils/FrameworkOverrides';
import {GenerateUUID} from 'Utils/General/KeyGenerator';

@UserEdit
export class AddTimelineStep extends Command<{timelineID: string, step: TimelineStep}, {}> {
	stepID: string;
	timeline_oldSteps: string[];
	async Prepare() {
		const { timelineID, step } = this.payload;

		// const lastStepID = await GetDataAsync('general', 'data', '.lastTimelineStepID') as number;
		this.stepID = GenerateUUID();
		step.timelineID = timelineID;

		this.timeline_oldSteps = await GetDataAsync('timelines', timelineID, '.steps') || [];
	}
	async Validate() {
		const { step } = this.payload;
		AssertValidate('TimelineStep', step, 'TimelineStep invalid');
	}

	GetDBUpdates() {
		const { timelineID, step } = this.payload;
		const updates = {
			// add step
			//'general/data/.lastTimelineStepID': this.stepID,
			[`timelineSteps/${this.stepID}`]: step,
			// add to timeline
			[`timelines/${timelineID}/.steps`]: this.timeline_oldSteps.concat(this.stepID),
		} as any;
		return updates;
	}
}
