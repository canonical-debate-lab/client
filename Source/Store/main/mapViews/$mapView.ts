import {RootNodeViewsReducer} from "./$mapView/rootNodeViews";
import Action from "../../../Frame/General/Action";
import {MapView} from "./@MapViews";
import u from "updeep";
import {DBPath} from "../../../Frame/Database/DatabaseHelpers";
import {GetFocusedNodePath} from "../mapViews";
import {ShallowEquals, ShallowChanged} from "react-vextensions";
import {GetTreeNodesInObjTree} from "js-vextensions";
import {SimpleReducer} from "Store";

/*export let MapViewReducer = CombineReducers(()=>({rootNodeViews: {}}), {
	rootNodeViews: RootNodeViewsReducer,
});*/

export class ACTMapViewMerge extends Action<{mapID: number, mapView: MapView}> {}

export function MapViewReducer(state = new MapView(), action: Action<any>, mapID: number) {
	if (action.Is(ACTMapViewMerge) && action.payload.mapID == mapID) {
		let newState = state;

		let oldTreeNodes = GetTreeNodesInObjTree(state, true);
		let newTreeNodes = GetTreeNodesInObjTree(action.payload.mapView, true);

		// deselect old selected-node, if a new one's being set
		let oldSelectedNode_treeNode = oldTreeNodes.FirstOrX(a=>a.Value && a.Value.selected);
		let newSelectedNode_treeNode = newTreeNodes.FirstOrX(a=>a.Value && a.Value.selected);
		if (oldSelectedNode_treeNode && newSelectedNode_treeNode) {
			newState = u.updateIn(oldSelectedNode_treeNode.PathStr_Updeep, u.omit(["selected", "openPanel"]), newState);
		}

		// defocus old focused-node, if a new one's being set
		let oldFocusedNode_treeNode = oldTreeNodes.FirstOrX(a=>a.Value && a.Value.focused);
		let newFocusedNode_treeNode = newTreeNodes.FirstOrX(a=>a.Value && a.Value.focused);
		if (oldFocusedNode_treeNode && newFocusedNode_treeNode) {
			newState = u.updateIn(oldFocusedNode_treeNode.PathStr_Updeep, u.omit(["focused", "viewOffset"]), newState);
		}

		let updatePrimitiveTreeNodes = GetTreeNodesInObjTree(action.payload.mapView).filter(a=>IsPrimitive(a.Value) || a.Value == null);
		for (let updatedNode of updatePrimitiveTreeNodes) {
			newState = u.updateIn(updatedNode.PathStr_Updeep, updatedNode.Value, newState);
		}

		return newState;
	}

	let newState = {...state,
		rootNodeViews: RootNodeViewsReducer(state.rootNodeViews, action, mapID),
		bot_currentNodeID: SimpleReducer(`main/mapViews/${mapID}/bot_currentNodeID`)(state.bot_currentNodeID, action),
	};
	if (ShallowChanged(state, newState)) return newState;
	
	return state;
}

/*export function GetSelectedNodePath_FromMapView(mapView: MapView) {
	let selectedTreeNode = GetTreeNodesInObjTree(mapView.rootNodeViews).FirstOrX(a=>a.prop == "selected" && a.Value);
	if (selectedTreeNode == null) return null;
	let selectedNodeView = selectedTreeNode.ancestorNodes.Last();
	return selectedNodeView.prop.ToInt();
}*/