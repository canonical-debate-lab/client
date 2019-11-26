import { UserEdit } from 'Server/CommandMacros';
import { TimelineStep } from 'Store/firebase/timelineSteps/@TimelineStep';
import {Command} from 'mobx-firelink';
import {GetAsync} from 'Utils/LibIntegrations/MobXFirelink';
import { GetTimeline, GetTimelineStep } from '../../Store/firebase/timelines';


@UserEdit
export class DeleteTimelineStep extends Command<{stepID: string}, {}> {
	oldData: TimelineStep;
	timeline_oldSteps: string[];
	async Prepare() {
		const { stepID } = this.payload;
		this.oldData = await GetAsync(() => GetTimelineStep(stepID));
		const timeline = await GetAsync(() => GetTimeline(this.oldData.timelineID));
		this.timeline_oldSteps = timeline.steps;
	}
	async Validate() {}

	GetDBUpdates() {
		const { stepID } = this.payload;
		const updates = {};
		updates[`timelines/${this.oldData.timelineID}/.steps`] = this.timeline_oldSteps.Except(stepID);
		updates[`timelineSteps/${stepID}`] = null;
		return updates;
	}
}
