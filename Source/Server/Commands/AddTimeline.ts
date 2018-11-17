import { UserEdit } from 'Server/CommandMacros';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetDataAsync } from '../../Frame/Database/DatabaseHelpers';
import { Command } from '../Command';

@UserEdit
export class AddTimeline extends Command<{mapID: number, timeline: Timeline}, number> {
	timelineID: number;
	async Prepare() {
		const { mapID, timeline } = this.payload;

		const lastTimelineID = await GetDataAsync('general', 'data', '.lastTimelineID') as number;
		this.timelineID = lastTimelineID + 1;
		timeline.mapID = mapID;
		timeline.createdAt = Date.now();

		this.returnData = this.timelineID;
	}
	async Validate() {
		const { timeline } = this.payload;
		AssertValidate('Timeline', timeline, 'Timeline invalid');
	}

	GetDBUpdates() {
		const { mapID, timeline } = this.payload;
		const updates = {
			'general/data/.lastTimelineID': this.timelineID,
			[`timelines/${this.timelineID}`]: timeline,
			[`maps/${mapID}/.timelines/.${this.timelineID}`]: true,
		} as any;
		return updates;
	}
}
