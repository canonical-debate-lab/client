import { MapEdit } from 'Server/CommandMacros';
import { Assert, GetValues_ForSchema } from 'js-vextensions';
import { AssertValidate, AddSchema , GetAsync_Raw, GetDataAsync , Command } from 'Utils/FrameworkOverrides';


import { GenerateUUID } from 'Utils/General/KeyGenerator';
import { GetClaimType, GetNodeL2 } from '../../Store/firebase/nodes/$node';
import { Equation } from '../../Store/firebase/nodes/@Equation';
import { ClaimType, MapNodeL2 } from '../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision } from '../../Store/firebase/nodes/@MapNodeRevision';
import { UserEdit } from './../CommandMacros';

export const conversionTypes = [
	// from normal to...
	'Normal>Equation',
	// each type back to normal
	'Equation>Normal',
];
export function CanConvertFromClaimTypeXToY(from: ClaimType, to: ClaimType) {
	return conversionTypes.Contains(`${ClaimType[from]}>${ClaimType[to]}`);
}

AddSchema('ChangeClaimType_payload', {
	properties: {
		mapID: { type: 'string' },
		nodeID: { type: 'string' },
		newType: { oneOf: GetValues_ForSchema(ClaimType) },
	},
	required: ['nodeID', 'newType'],
});

@MapEdit
@UserEdit
export class ChangeClaimType extends Command<{mapID?: number, nodeID: string, newType: ClaimType}, {}> {
	Validate_Early() {
		AssertValidate('ChangeClaimType_payload', this.payload, 'Payload invalid');
	}

	oldType: ClaimType;
	newData: MapNodeL2;
	newRevision: MapNodeRevision;
	newRevisionID: string;
	async Prepare() {
		const { nodeID, newType } = this.payload;
		// let oldData = await GetDataAsync({addHelpers: false}, "nodes", nodeID) as MapNode;
		const oldData = await GetAsync_Raw(() => GetNodeL2(nodeID));
		this.oldType = GetClaimType(oldData);

		this.newData = { ...oldData.Excluding('current') as any };
		// this.newRevisionID = (await GetDataAsync('general', 'data', '.lastNodeRevisionID')) + 1;
		this.newRevisionID = GenerateUUID();
		this.newRevision = { ...oldData.current };
		this.newData.currentRevision = this.newRevisionID;

		if (this.oldType == ClaimType.Normal) {
			if (newType == ClaimType.Equation) {
				this.newRevision.equation = new Equation().VSet({ text: this.newRevision.titles.base });
				delete this.newRevision.titles;
			}
		} else if (this.oldType == ClaimType.Equation) {
			if (newType == ClaimType.Normal) {
				this.newRevision.titles = { base: this.newRevision.equation.text };
				delete this.newRevision.equation;
			}
		}
	}
	async Validate() {
		const { newType } = this.payload;
		Assert(CanConvertFromClaimTypeXToY(this.oldType, newType), `Cannot convert from claim-type ${ClaimType[this.oldType]} to ${ClaimType[newType]}.`);
		AssertValidate('MapNode', this.newData, 'New node-data invalid');
		AssertValidate('MapNodeRevision', this.newRevisionID, 'New revision-data invalid');
	}

	GetDBUpdates() {
		const { nodeID } = this.payload;
		const updates = {};
		updates[`nodes/${nodeID}`] = this.newData;
		// updates['general/data/.lastNodeRevisionID'] = this.newRevisionID;
		updates[`nodeRevisions/${this.newRevisionID}`] = this.newRevision;
		return updates;
	}
}
