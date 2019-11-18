import { Clone } from 'js-vextensions';
import { FirebaseData } from '../../../../Store_Old/firebase';
import { AddUpgradeFunc } from '../../Admin';

const newVersion = 10;
AddUpgradeFunc(newVersion, async (oldData, markProgress) => {
	const data = Clone(oldData) as FirebaseData;
	const v8Data = window['v8Data']; // set using console

	// convert "probability" and "degree" ratings into "truth" ratings
	// ==========

	markProgress(0, 0, 1);
	for (const { index, value: nodeRatingRoot } of data.nodeRatings.Props(true)) {
		await markProgress(1, index, data.nodeRatings.Props(true).length);
		if (nodeRatingRoot.probability) {
			nodeRatingRoot.truth = nodeRatingRoot.probability;
			delete nodeRatingRoot.probability;
		}
		if (nodeRatingRoot.degree) {
			nodeRatingRoot.truth = nodeRatingRoot.degree;
			delete nodeRatingRoot.degree;
		}
	}

	// convert "probability" and "degree" ratings into "truth" ratings
	// ==========

	markProgress(0, 0, 1);
	for (const { index, name: nodeIDStr, value: nodeRatingRoot } of v8Data.nodeRatings.Props(true)) {
		await markProgress(1, index, v8Data.nodeRatings.Props(true).length);
		if (nodeRatingRoot.impact) {
			const argumentNodeID = parseInt(nodeIDStr) - 1; // argument-node's id is always one lower than impact-premise's
			data.nodeRatings[argumentNodeID] = data.nodeRatings[argumentNodeID] || {};
			data.nodeRatings[argumentNodeID].relevance = nodeRatingRoot.impact;
			delete data.nodeRatings[nodeIDStr];
		}
	}

	return data;
});
