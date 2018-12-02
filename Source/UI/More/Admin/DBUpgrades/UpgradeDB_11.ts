import { GetSearchTerms } from 'Server/Commands/AddNodeRevision';
import { MapNodeRevision } from 'Store/firebase/nodes/@MapNodeRevision';
import { FirebaseData } from '../../../../Store/firebase';
import { AddUpgradeFunc } from '../../Admin';

const newVersion = 11;
AddUpgradeFunc(newVersion, async (oldData, markProgress) => {
	const data = Clone(oldData) as FirebaseData;

	// populate "titles.allTerms" property of each node-revision
	// ==========

	for (const revision of data.nodeRevisions.VValues(true) as MapNodeRevision[]) {
		if (revision.titles == null) continue;
		const titles_joined = revision.titles.VValues(true).join(' ');
		revision.titles.allTerms = GetSearchTerms(titles_joined).ToMap(a => a, () => true);
	}

	return data;
});
