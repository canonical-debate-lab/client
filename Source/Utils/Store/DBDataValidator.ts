import { FirebaseData } from 'Store/firebase';
import { AssertValidate } from 'Utils/FrameworkOverrides';

export function ValidateDBData(data: FirebaseData) {
	function ValidateCollection(collection, itemType: string) {
		(collection || {}).VValues(1).forEach((entry) => {
			AssertValidate(itemType, entry, `${itemType} invalid`);
		});
	}

	ValidateCollection(data.images, 'Image');
	ValidateCollection(data.layers, 'Layer');
	ValidateCollection(data.maps, 'Map');
	ValidateCollection(data.nodes, 'MapNode');
	ValidateCollection(data.nodePhrasings, 'MapNodePhrasing');
	ValidateCollection(data.nodeRevisions, 'MapNodeRevision');
	ValidateCollection(data.terms, 'Term');
	ValidateCollection(data.termComponents, 'TermComponent');
	ValidateCollection(data.timelines, 'Timeline');
	ValidateCollection(data.timelineSteps, 'TimelineStep');
}
