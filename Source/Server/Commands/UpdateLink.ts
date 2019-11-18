import { GetNode } from 'Store_Old/firebase/nodes';
import { AddSchema, AssertValidate, Command, GetAsync_Raw, GetSchemaJSON } from 'Utils/FrameworkOverrides';
import { GetLinkUnderParent } from '../../Store_Old/firebase/nodes/$node';
import { ChildEntry } from '../../Store_Old/firebase/nodes/@MapNode';
import { UserEdit } from '../CommandMacros';

AddSchema('UpdateLink_payload', ['ChildEntry'], () => ({
	properties: {
		linkParentID: { type: 'string' },
		linkChildID: { type: 'string' },
		linkUpdates: GetSchemaJSON('ChildEntry').Including('form', 'polarity'),
	},
	required: ['linkParentID', 'linkChildID', 'linkUpdates'],
}));

@UserEdit
export class UpdateLink extends Command<{linkParentID: string, linkChildID: string, linkUpdates: Partial<ChildEntry>}, {}> {
	Validate_Early() {
		AssertValidate('UpdateLink_payload', this.payload, 'Payload invalid');
	}

	newData: ChildEntry;
	async Prepare() {
		const { linkParentID, linkChildID, linkUpdates } = this.payload;
		const parent = await GetAsync_Raw(() => GetNode(linkParentID));
		const oldData = GetLinkUnderParent(linkChildID, parent);
		this.newData = { ...oldData, ...linkUpdates };
	}
	async Validate() {
		AssertValidate('ChildEntry', this.newData, 'New link-data invalid');
	}

	GetDBUpdates() {
		const { linkParentID, linkChildID } = this.payload;
		const updates = {};
		updates[`nodes/${linkParentID}/.children/.${linkChildID}`] = this.newData;
		return updates;
	}
}
