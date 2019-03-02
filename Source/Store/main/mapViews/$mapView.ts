import { GetTreeNodesInObjTree } from 'js-vextensions';
import { ShallowChanged } from 'react-vextensions';
import u from 'updeep';
import { Action, SimpleReducer } from 'Utils/FrameworkOverrides';
import { RootNodeViewsReducer } from './$mapView/rootNodeViews';
import { MapView } from './@MapViews';

/* export let MapViewReducer = CombineReducers(()=>({rootNodeViews: {}}), {
	rootNodeViews: RootNodeViewsReducer,
}); */

export class ACTMapViewMerge extends Action<{mapID: number, mapView: MapView}> {}

export function MapViewReducer(state = new MapView(), action: Action<any>, mapID: number) {
	if (action.Is(ACTMapViewMerge) && action.payload.mapID == mapID) {
		let newState = state;

		const oldTreeNodes = GetTreeNodesInObjTree(state, true);
		const newTreeNodes = GetTreeNodesInObjTree(action.payload.mapView, true);

		// deselect old selected-node, if a new one's being set
		const oldSelectedNode_treeNode = oldTreeNodes.FirstOrX(a => a.Value && a.Value.selected);
		const newSelectedNode_treeNode = newTreeNodes.FirstOrX(a => a.Value && a.Value.selected);
		if (oldSelectedNode_treeNode && newSelectedNode_treeNode) {
			newState = u.updateIn(oldSelectedNode_treeNode.PathStr_Updeep, u.omit(['selected', 'openPanel']), newState);
		}

		// defocus old focused-node, if a new one's being set
		const oldFocusedNode_treeNode = oldTreeNodes.FirstOrX(a => a.Value && a.Value.focused);
		const newFocusedNode_treeNode = newTreeNodes.FirstOrX(a => a.Value && a.Value.focused);
		if (oldFocusedNode_treeNode && newFocusedNode_treeNode) {
			newState = u.updateIn(oldFocusedNode_treeNode.PathStr_Updeep, u.omit(['focused', 'viewOffset']), newState);
		}

		const updatePrimitiveTreeNodes = GetTreeNodesInObjTree(action.payload.mapView).filter(a => IsPrimitive(a.Value) || a.Value == null);
		for (const updatedNode of updatePrimitiveTreeNodes) {
			newState = u.updateIn(updatedNode.PathStr_Updeep, updatedNode.Value, newState);
		}

		return newState;
	}

	const newState = { ...state,
		rootNodeViews: RootNodeViewsReducer(state.rootNodeViews, action, mapID),
		bot_currentNodeID: SimpleReducer(`main/mapViews/${mapID}/bot_currentNodeID`)(state.bot_currentNodeID, action),
	};
	if (ShallowChanged(state, newState)) return newState;

	return state;
}

/* export function GetSelectedNodePath_FromMapView(mapView: MapView) {
	let selectedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a=>a.prop == "selected" && a.Value);
	if (selectedTreeNode == null) return null;
	let selectedNodeView = selectedTreeNode.ancestorNodes.Last();
	return selectedNodeView.prop.ToInt();
} */
