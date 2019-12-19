import { autorun, runInAction } from 'mobx';
import { GetOpenMapID, ACTEnsureMapStateInit } from 'Store/main';
import { GetMap } from 'Store/firebase/maps';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { GetNodeView, ACTMapNodeExpandedSet } from 'Store/main/mapViews/$mapView';
import { store } from 'Store';
import { GetAsync } from 'mobx-firelink';
import { Assert } from 'js-vextensions';

let lastMapID;
autorun(() => {
	const mapID = GetOpenMapID();
	if (mapID != lastMapID) {
		lastMapID = mapID;
		if (mapID) {
			StartInitForNewlyLoadedMap(mapID);
		}
	}
}, { name: 'InitForNewlyLoadedMap' });

async function StartInitForNewlyLoadedMap(mapID: string) {
	Assert(mapID != null, 'mapID cannot be null.');
	const map = await GetAsync(() => GetMap(mapID));

	// ACTEnsureMapStateInit(action.payload.id);
	// storeM.ACTEnsureMapStateInit(action.payload.id);
	runInAction('StartInitForNewlyLoadedMap_part1', () => {
		ACTEnsureMapStateInit(mapID);
	});

	let pathsToExpand = [`${map.rootNode}`];
	for (let depth = 0; depth < map.defaultExpandDepth; depth++) {
		const newPathsToExpand = [];
		for (const path of pathsToExpand) {
			const nodeID = path.split('/').Last();
			const node = await GetAsync(() => GetNodeL2(nodeID));
			if (GetNodeView(map._key, path, false) == null) {
				ACTMapNodeExpandedSet({ mapID: map._key, path, expanded: true, resetSubtree: false });
			}
			if (node.children) {
				newPathsToExpand.push(...node.children.VKeys(true).map((childID) => `${path}/${childID}`));
			}
		}
		pathsToExpand = newPathsToExpand;
	}
}
