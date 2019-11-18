import { UserEdit } from 'Server/CommandMacros';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetAsync , Command } from 'Utils/FrameworkOverrides';
import { GetTimeline } from '../../Store/firebase/timelines';


@UserEdit
export class DeleteTimeline extends Command<{timelineID: string}, {}> {
	oldData: Timeline;
	async Prepare() {
		const { timelineID } = this.payload;
		this.oldData = await GetAsync(() => GetTimeline(timelineID));
	}
	async Validate() {
		if (this.oldData.steps) {
			throw new Error('Cannot delete a timeline until all its steps have been deleted.');
		}
	}

	GetDBUpdates() {
		const { timelineID } = this.payload;
		const updates = {};
		updates[`timelines/${timelineID}`] = null;
		updates[`maps/${this.oldData.mapID}/.timelines/.${timelineID}`] = null;
		return updates;
	}
}
