import { UserEdit } from 'Server/CommandMacros';
import { Command } from 'mobx-firelink';
import { GetAsync } from 'Utils/LibIntegrations/MobXFirelink';
import { GetTimeline } from 'Store/firebase/timelines';

@UserEdit
export class UpdateTimelineStepOrder extends Command<{timelineID: string, stepID: string, newIndex: number}, {}> {
	timeline_oldSteps: string[];
	timeline_newSteps: string[];
	async Prepare() {
		const { timelineID, stepID, newIndex } = this.payload;
		this.timeline_oldSteps = await GetAsync(() => GetTimeline(timelineID)?.steps) || [];
		this.timeline_newSteps = this.timeline_oldSteps.slice();
		this.timeline_newSteps.Move(stepID, newIndex, true);
	}
	async Validate() {}

	GetDBUpdates() {
		const { timelineID } = this.payload;
		const updates = {
			[`timelines/${timelineID}/.steps`]: this.timeline_newSteps,
		} as any;
		return updates;
	}
}
