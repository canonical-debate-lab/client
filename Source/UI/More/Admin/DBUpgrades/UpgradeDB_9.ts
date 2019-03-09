import { DeleteNode } from 'Server/Commands/DeleteNode';
import { UpdateStateDataOverride } from 'UI/@Shared/StateOverrides';
import { ApplyDBUpdates_Local, DBPath } from 'Utils/FrameworkOverrides';
import {Clone} from 'js-vextensions';
import { FirebaseData } from '../../../../Store/firebase';
import { MapNodeType } from '../../../../Store/firebase/nodes/@MapNodeType';
import { AddUpgradeFunc } from '../../Admin';

const newVersion = 9;
AddUpgradeFunc(newVersion, async (oldData, markProgress) => {
	let data = Clone(oldData) as FirebaseData;

	// [clean up some invalid data in prod db]
	// ==========

	markProgress(0, -1, 3);
	for (const { index, value: node } of data.nodes.Props(true)) {
		await markProgress(1, index, oldData.nodes.Props(true).length);
		const revision = data.nodeRevisions[node.currentRevision];

		if (node.type != MapNodeType.Category && node.parents == null && node.children == null) {
			// delete node
			const deleteNode = new DeleteNode({ nodeID: node._id });
			await deleteNode.PreRun();
			data = ApplyDBUpdates_Local(data, deleteNode.GetDBUpdates());
		}
	}

	// remove impact-premise nodes
	// ==========

	markProgress(0, 0, 3);
	for (const { index, value: node } of data.nodes.Props(true)) {
		await markProgress(1, index, oldData.nodes.Props(true).length);
		const revision = data.nodeRevisions[node.currentRevision];
		if (revision['impactPremise']) {
			// move impact-premise children to children of argument (as relevance arguments now)
			const parentArg = data.nodes[node.parents.VKeys(true)[0]];
			for (const childID of (node.children || {}).VKeys(true)) {
				const child = data.nodes[childID];
				parentArg.children[childID] = node.children[childID];
				delete node.children[childID];
				child.parents[parentArg._id] = { _: true };
				delete child.parents[node._id];
			}

			// set argument-type to impact-premise's if-type
			const parentArgRevision = data.nodeRevisions[parentArg.currentRevision];
			parentArgRevision.argumentType = revision['impactPremise'].ifType;

			UpdateStateDataOverride({ [`firebase/data/${DBPath()}/nodes/${node._id}/children`]: null });

			// delete impact-premise node
			const deleteNode = new DeleteNode({ nodeID: node._id });
			await deleteNode.PreRun();
			data = ApplyDBUpdates_Local(data, deleteNode.GetDBUpdates());
		}
	}

	// add empty revision.titles if missing
	// ==========

	markProgress(0, 1);
	for (const { index, value: revision } of data.nodeRevisions.Props(true)) {
		await markProgress(1, index, oldData.nodeRevisions.Props(true).length);
		if (revision.titles == null) {
			revision.titles = { base: '' };
		}
	}

	// find arguments with more than one premise, and mark them as multi-premise arguments
	// ==========

	markProgress(0, 2);
	for (const { index, value: node } of data.nodes.Props(true)) {
		await markProgress(1, index, oldData.nodes.Props(true).length);
		if (node.type == MapNodeType.Argument) {
			const children = (node.children || {}).VKeys(true).map(id => data.nodes[id]);
			const childClaims = children.filter(a => a.type == MapNodeType.Claim);
			if (childClaims.length > 1) {
				node.multiPremiseArgument = true;
			}
		}
	}

	return data;
});
