import { FirebaseData } from 'Store/firebase';
import { AssertValidate } from 'Utils/FrameworkOverrides';

export function ValidateDBData(data: FirebaseData) {
	for (const map of (data.maps || {}).VValues(true)) AssertValidate('Map', map, 'Map invalid');
	for (const node of (data.nodes || {}).VValues(true)) AssertValidate('MapNode', node, 'Node invalid');
	for (const revision of (data.nodeRevisions || {}).VValues(true)) AssertValidate('MapNodeRevision', revision, 'Node-revision invalid');
	for (const termComp of (data.termComponents || {}).VValues(true)) AssertValidate('TermComponent', termComp, 'Term-component invalid');
	for (const term of (data.terms || {}).VValues(true)) AssertValidate('Term', term, 'Term invalid');
}
