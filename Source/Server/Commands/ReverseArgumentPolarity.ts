import { Assert } from 'js-vextensions';
import { MapEdit } from 'Server/CommandMacros';
import { AddSchema, AssertValidate } from 'Utils/FrameworkOverrides';
import { Command } from 'mobx-firelink';
import {GetAsync} from 'Utils/LibIntegrations/MobXFirelink';
import { GetParentNodeID } from '../../Store/firebase/nodes';
import { GetNodeL3, ReversePolarity } from '../../Store/firebase/nodes/$node';
import { ChildEntry, MapNodeL3 } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeType } from '../../Store/firebase/nodes/@MapNodeType';
import { UserEdit } from '../CommandMacros';

AddSchema('ReverseArgumentPolarity_payload', {
	properties: {
		mapID: { type: 'string' },
		nodeID: { type: 'string' },
		path: { type: 'string' },
	},
	required: ['nodeID'],
});

@MapEdit
@UserEdit
export class ReverseArgumentPolarity extends Command<{mapID?: number, nodeID: string, path: string}, {}> {
	Validate_Early() {
		AssertValidate('ReverseArgumentPolarity_payload', this.payload, 'Payload invalid');
	}

	parentID: string;
	oldNodeData: MapNodeL3;
	newLinkData: ChildEntry;
	async Prepare() {
		const { nodeID, path } = this.payload;

		this.oldNodeData = await GetAsync(() => GetNodeL3(path));
		this.parentID = GetParentNodeID(path);

		this.newLinkData = { ...this.oldNodeData.link };
		this.newLinkData.polarity = ReversePolarity(this.newLinkData.polarity);
	}
	async Validate() {
		Assert(this.oldNodeData.type == MapNodeType.Argument, 'Can only reverse polarity of an argument node.');
		AssertValidate('ChildEntry', this.newLinkData, 'New link-data invalid');
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;

		const updates = {};
		updates[`nodes/${this.parentID}/.children/.${nodeID}`] = this.newLinkData;
		return updates;
	}
}
