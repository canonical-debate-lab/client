import { AddSchema, AssertValidate, Command, GetDataAsync, GetSchemaJSON, Schema, WaitTillSchemaAddedThenRun, GetAsync, GetData } from 'Utils/FrameworkOverrides';
import { Timeline } from 'Store/firebase/timelines/@Timeline';
import { GetTimeline } from 'Store/firebase/timelines';
import { User } from '../../Store/firebase/users/@User';

type MainType = Timeline;
const MTName = 'Timeline';

WaitTillSchemaAddedThenRun(MTName, () => {
	AddSchema({
		properties: {
			id: { type: 'string' },
			updates: Schema({
				properties: GetSchemaJSON(MTName)['properties'].Including('name', 'videoID', 'videoStartTime', 'videoHeightVSWidthPercent'),
			}),
		},
		required: ['id', 'updates'],
	}, `Update${MTName}_payload`);
});

export class UpdateTimeline extends Command<{id: string, updates: Partial<MainType>}, {}> {
	Validate_Early() {
		AssertValidate(`Update${MTName}_payload`, this.payload, 'Payload invalid');
	}

	oldData: MainType;
	newData: MainType;
	async Prepare() {
		const { id, updates } = this.payload;
		// this.oldData = await GetAsync(() => GetTimeline(id));
		this.oldData = await GetDataAsync({ addHelpers: false }, 'timelines', id) as MainType;
		this.newData = { ...this.oldData, ...updates };
	}
	async Validate() {
		AssertValidate(MTName, this.newData, `New ${MTName.toLowerCase()}-data invalid`);
	}

	GetDBUpdates() {
		const { id } = this.payload;
		const updates = {};
		updates[`timelines/${id}`] = this.newData;
		return updates;
	}
}
