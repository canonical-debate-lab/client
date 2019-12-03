import { UserEdit } from 'Server/CommandMacros';
import { MapNodePhrasing } from 'Store/firebase/nodePhrasings/@MapNodePhrasing';
import { AddSchema, AssertValidate } from 'Utils/FrameworkOverrides';
import { GenerateUUID } from 'Utils/General/KeyGenerator';
import { GetNode } from 'Store/firebase/nodes';
import { Assert } from 'js-vextensions';
import { Command, GetAsync } from 'mobx-firelink';

/* AddSchema({
	properties: {
		phrasing: { $ref: 'MapNodePhrasing' },
	},
	required: ['phrasing'],
}, 'AddPhrasing_payload'); */

@UserEdit
export class AddPhrasing extends Command<{phrasing: MapNodePhrasing}, {}> {
	/* Validate_Early() {
		AssertValidate('AddPhrasing_payload', this.payload, 'Payload invalid');
	} */

	id: string;
	async Prepare() {
		const { phrasing } = this.payload;

		this.id = GenerateUUID();
		phrasing.creator = this.userInfo.id;
		phrasing.createdAt = Date.now();
	}
	async Validate() {
		const { phrasing } = this.payload;
		AssertValidate('MapNodePhrasing', phrasing, 'MapNodePhrasing invalid');
		const node = await GetAsync(() => GetNode(phrasing.node));
		Assert(node, `Node with id ${phrasing.node} does not exist.`);
	}

	GetDBUpdates() {
		const { phrasing } = this.payload;
		const updates = {
			[`nodePhrasings/${this.id}`]: phrasing,
		};
		return updates;
	}
}
