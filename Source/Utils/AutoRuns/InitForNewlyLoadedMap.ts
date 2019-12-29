import { autorun, runInAction } from 'mobx';
import { GetOpenMapID } from 'Store/main';
import { GetMap } from 'Store/firebase/maps';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { GetNodeView, ACTMapNodeExpandedSet, MapView, MapNodeView } from 'Store/main/maps/mapViews/$mapView';
import { store } from 'Store';
import { GetAsync } from 'mobx-firelink';
import { Assert, Vector2i } from 'js-vextensions';
import { UserMapInfo } from 'Store/firebase/userMapInfo/@UserMapInfo';
import { MapState, TimelineSubpanel } from 'Store/main/maps/mapStates/@MapState';
import { MapUI, ACTUpdateFocusNodeAndViewOffset, ACTSetFocusNodeAndViewOffset } from 'UI/@Shared/Maps/MapUI';
import { GetMapState } from 'Store/main/maps/mapStates/$mapState';
import { ACTEnsureMapStateInit } from 'Store/main/maps';

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
	let mapState = GetMapState(mapID);
	if (mapState?.initDone) return;
	const map = await GetAsync(() => GetMap(mapID));

	// ACTEnsureMapStateInit(action.payload.id);
	// storeM.ACTEnsureMapStateInit(action.payload.id);
	let mapView: MapView;
	runInAction('StartInitForNewlyLoadedMap_part1', () => {
		({ mapState, mapView } = ACTEnsureMapStateInit(mapID));
		if (map.defaultTimelineID) {
			mapState.timelinePanelOpen = true;
			mapState.timelineOpenSubpanel = TimelineSubpanel.Playing;
			mapState.selectedTimeline = map.defaultTimelineID;
		}
	});

	let pathsToExpand = [map.rootNode];
	for (let depth = 0; depth < map.defaultExpandDepth; depth++) {
		const newPathsToExpand = [];
		for (const path of pathsToExpand) {
			const nodeID = path.split('/').Last();
			const node = await GetAsync(() => GetNodeL2(nodeID));
			// console.log('NodeView:', path, GetNodeView(map._key, path, false));
			if (GetNodeView(map._key, path, false) == null) {
				// console.log('Expanding:', path);
				ACTMapNodeExpandedSet({ mapID: map._key, path, expanded: true, resetSubtree: false });
			}
			if (node.children) {
				newPathsToExpand.push(...node.children.VKeys(true).map((childID) => `${path}/${childID}`));
			}
		}
		pathsToExpand = newPathsToExpand;
	}

	// have view start a bit to the right of the root node
	ACTSetFocusNodeAndViewOffset(mapID, map.rootNode, new Vector2i(300, 0));

	runInAction('StartInitForNewlyLoadedMap_markInitDone', () => mapState.initDone = true);

	// probably temp (find more elegant way)
	const mapUI = MapUI.CurrentMapUI;
	// console.log('MapUI:', mapUI);
	if (mapUI) {
		mapUI.StartLoadingScroll();
	}
}
