import { AssertV, Command } from 'mobx-firelink';
import { GetTimeline } from 'Store/firebase/timelines';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { AddSchema, AssertValidate, GetSchemaJSON, Schema } from 'vwebapp-framework';

type MainType = Timeline;
const MTName = 'Timeline';

AddSchema(`Update${MTName}_payload`, [MTName], () => ({
	properties: {
		id: { type: 'string' },
		updates: Schema({
			properties: GetSchemaJSON(MTName)['properties'].Including('name', 'videoID', 'videoStartTime', 'videoHeightVSWidthPercent'),
		}),
	},
	required: ['id', 'updates'],
}));

export class UpdateTimeline extends Command<{id: string, updates: Partial<MainType>}, {}> {
	oldData: MainType;
	newData: MainType;
	Validate() {
		AssertValidate(`Update${MTName}_payload`, this.payload, 'Payload invalid');

		const { id, updates } = this.payload;
		// this.oldData = await GetAsync(() => GetTimeline(id));
		this.oldData = GetTimeline(id);
		AssertV(this.oldData, 'oldData is null.');
		this.newData = { ...this.oldData, ...updates };
		AssertValidate(MTName, this.newData, `New ${MTName.toLowerCase()}-data invalid`);
	}

	GetDBUpdates() {
		const { id } = this.payload;
		const updates = {};
		updates[`timelines/${id}`] = this.newData;
		return updates;
	}
}
