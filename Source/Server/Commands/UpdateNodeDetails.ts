/*import {Assert} from "js-vextensions";
import {GetDataAsync} from "../../Frame/Database/DatabaseHelpers";
import {Command} from "../Command";
import {MapNode, ClaimForm, ChildEntry, AccessLevel} from "../../Store/firebase/nodes/@MapNode";
import {E} from "js-vextensions";
import {GetValues_ForSchema} from "../../Frame/General/Enums";
import { UserEdit, MapEdit } from "Server/CommandMacros";

AddSchema({
	properties: {
		mapID: {type: "number"},
		nodeID: {type: "number"},
		nodeUpdates: Schema({
			properties: {
				titles: {
					properties: {
						base: {type: "string"}, negation: {type: "string"}, yesNoQuestion: {type: "string"},
					},
					//required: ["base", "negation", "yesNoQuestion"],
				},
				note: {type: ["null", "string"]},
				votingDisabled: {type: ["null", "boolean"]},

				accessLevel: {oneOf: GetValues_ForSchema(AccessLevel).concat({const: null})},
				voteLevel: {oneOf: GetValues_ForSchema(AccessLevel).concat({const: null})},

				relative: {type: "boolean"},
				fontSizeOverride: {type: ["null", "number"]},
				widthOverride: {type: ["null", "number"]},

				equation: {$ref: "Equation"},
				contentNode: {$ref: "ContentNode"},
				image: {$ref: "ImageAttachment"},

				//chainAfter: {oneOf: [{type: "null"}, {type: "string", pattern: MapNode_chainAfterFormat}]},
				childrenOrder: {items: {type: "number"}},
			},
		}),
		linkParentID: {type: "number"},
		linkUpdates: Schema({
			properties: {
				_: {type: "boolean"},
				form: {oneOf: GetValues_ForSchema(ThesisForm)},
				seriesAnchor: {type: ["null", "boolean"]},
			},
		}),
	},
	//required: ["nodeID", "nodeUpdates", "linkParentID", "linkUpdates"],
	required: ["nodeID", "nodeUpdates"],
}, "UpdateNodeDetails_payload");

@MapEdit
@UserEdit
export default class UpdateNodeDetails extends Command
		<{mapID?: number, nodeID: number, nodeUpdates: Partial<MapNode>, linkParentID?: number, linkUpdates?: Partial<ChildEntry>}> {
	Validate_Early() {
		/*let allowedNodePropUpdates = ["relative", "titles", "contentNode"];
		Assert(nodeUpdates.VKeys().Except(...allowedNodePropUpdates).length == 0,
			`Cannot use this command to update node-props other than: ${allowedNodePropUpdates.join(", ")
			}\n\nYou provided: ${nodeUpdates.VKeys().Except(...allowedNodePropUpdates).join(", ")}`);
		let allowedLinkPropUpdates = ["form"];
		Assert(linkUpdates.VKeys().Except(...allowedLinkPropUpdates).length == 0,
			`Cannot use this command to update link-props other than: ${allowedLinkPropUpdates.join(", ")
			}\n\nYou provided: ${linkUpdates.VKeys().Except(...allowedLinkPropUpdates).join(", ")}`);*#/
		
		AssertValidate("UpdateNodeDetails_payload", this.payload, `Payload invalid`);
	}

	oldNodeData: MapNode;
	newNodeData: MapNode;
	oldLinkData: ChildEntry;
	newLinkData: ChildEntry;
	map_oldEditCount: number;
	user_oldEditCount: number;
	async Prepare() {
		let {mapID, nodeID, nodeUpdates, linkParentID, linkUpdates} = this.payload;
		this.oldNodeData = await GetDataAsync({addHelpers: false}, "nodes", nodeID) as MapNode;
		this.newNodeData = {...this.oldNodeData, ...nodeUpdates};
		if (linkUpdates) {
			this.oldLinkData = await GetDataAsync({addHelpers: false}, "nodes", linkParentID, "children", nodeID) as ChildEntry;
			this.newLinkData = {...this.oldLinkData, ...linkUpdates};
		}
	}
	async Validate() {
		//if (!AssertValidate("MapNode", newData, `New-data invalid`);
		AssertValidate("MapNode", this.newNodeData, `New node-data invalid`);
		if (this.newLinkData) {
			AssertValidate("ChildEntry", this.newLinkData, `New link-data invalid`);
		}
	}
	
	GetDBUpdates() {
		let {nodeID, nodeUpdates, linkParentID, linkUpdates} = this.payload;
		let updates = {};
		updates[`nodes/${nodeID}`] = this.newNodeData;
		if (this.newLinkData) {
			updates[`nodes/${linkParentID}/children/${nodeID}`] = this.newLinkData;
		}
		return updates;
	}
}*/