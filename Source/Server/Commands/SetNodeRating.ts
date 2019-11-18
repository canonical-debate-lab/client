import { Rating } from 'Store_Old/firebase/nodeRatings/@RatingsRoot';
import { RatingType } from 'Store_Old/firebase/nodeRatings/@RatingType';
import { AddSchema, AssertValidate, Command } from 'Utils/FrameworkOverrides';

AddSchema('SetNodeRating_payload', {
	properties: {
		nodeID: { type: 'string' },
		ratingType: { $ref: 'RatingType' },
		value: { type: ['number', 'null'] },
	},
	required: ['nodeID', 'ratingType', 'value'],
});

export class SetNodeRating extends Command<{nodeID: string, ratingType: RatingType, value: number}, {}> {
	Validate_Early() {
		AssertValidate('SetNodeRating_payload', this.payload, 'Payload invalid');
	}

	async Prepare() {}
	async Validate() {}

	GetDBUpdates() {
		const { nodeID, ratingType, value } = this.payload;
		const updates = {};
		updates[`nodeRatings/${nodeID}/${ratingType}/${this.userInfo.id}`] = value != null ? new Rating(value) : null;
		return updates;
	}
}
