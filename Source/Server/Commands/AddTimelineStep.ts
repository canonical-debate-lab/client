import { UserEdit } from 'Server/CommandMacros';
import { AssertValidate } from 'Utils/FrameworkOverrides';
import { GenerateUUID } from 'Utils/General/KeyGenerator';
import { Command, GetDoc_Async } from 'mobx-firelink';
import { TimelineStep } from '../../Store/firebase/timelineSteps/@TimelineStep';

@UserEdit
export class AddTimelineStep extends Command<{timelineID: string, step: TimelineStep, stepIndex?: number}, {}> {
	stepID: string;
	timeline_oldSteps: string[];
	timeline_newSteps: string[];
	async Prepare() {
		const { timelineID, step, stepIndex } = this.payload;

		// const lastStepID = await GetDataAsync('general', 'data', '.lastTimelineStepID') as number;
		this.stepID = GenerateUUID();
		step.timelineID = timelineID;

		// this.timeline_oldSteps = await GetDocField_Async(a=>a.timelines.get(timelineID), a=>a.steps) || [];
		this.timeline_oldSteps = (await GetDoc_Async({}, (a) => a.timelines.get(timelineID)))?.steps || [];
		this.timeline_newSteps = this.timeline_oldSteps.slice();
		if (stepIndex) {
			this.timeline_newSteps.Insert(stepIndex, this.stepID);
		} else {
			this.timeline_newSteps.push(this.stepID);
		}
	}
	async Validate() {
		const { step } = this.payload;
		AssertValidate('TimelineStep', step, 'TimelineStep invalid');
	}

	GetDBUpdates() {
		const { timelineID, step } = this.payload;
		const updates = {
			// add step
			// 'general/data/.lastTimelineStepID': this.stepID,
			[`timelineSteps/${this.stepID}`]: step,
			// add to timeline
			[`timelines/${timelineID}/.steps`]: this.timeline_newSteps,
		} as any;
		return updates;
	}
}
