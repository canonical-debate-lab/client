import { CommandNew } from 'mobx-firelink';
import { AssertValidate } from 'vwebapp-framework';

export class SetMapFeatured extends CommandNew<{id: string, featured: boolean}, {}> {
	StartValidate() {
		AssertValidate({
			properties: {
				id: { type: 'string' },
				featured: { type: 'boolean' },
			},
			required: ['id', 'featured'],
		}, this.payload, 'Payload invalid');

	}

	GetDBUpdates() {
		const { id, featured } = this.payload;
		return {
			[`maps/${id}/.featured`]: featured,
		};
	}
}
