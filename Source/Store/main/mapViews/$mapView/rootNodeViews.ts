import { GetTreeNodesInObjTree, Vector2i } from 'js-vextensions';
import u from 'updeep';
import {Action, SplitStringBySlash_Cached} from 'Utils/FrameworkOverrides';
import {MapNodeView} from "../@MapViews";
import {RootNodeViews} from './rootNodeViews/@RootNodeViews';

export class ACTMapNodeSelect extends Action<{mapID: number, path: string}> {}
export class ACTMapNodePanelOpen extends Action<{mapID: number, path: string, panel: string}> {}
export class ACTMapNodeExpandedSet extends Action<{
	mapID: number, path: string, recursive: boolean
	expanded?: boolean, expanded_truth?: boolean, expanded_relevance?: boolean
}> {}
export class ACTMapNodeChildLimitSet extends Action<{mapID: number, path: string, direction: 'down' | 'up', value: number}> {}
export class ACTMapNodeTermOpen extends Action<{mapID: number, path: string, termID: number}> {}

export class ACTViewCenterChange extends Action<{mapID: number, focusNodePath: string, viewOffset: Vector2i}> {}

export function RootNodeViewsReducer(state = new RootNodeViews(), action: Action<any>, mapID: number) {
	// for performance reasons, we do portions of some actions "at the root", instead of using the descendant reducers
	// ==========

	// if we're selecting a new node, at-root deselect the old selected node
	if (action.Is(ACTMapNodeSelect)) {
		const nodes = GetTreeNodesInObjTree(state, true);

		const selectedNode = nodes.FirstOrX(a => a.Value && a.Value.selected);
		if (selectedNode) {
			state = u.updateIn(selectedNode.PathStr_Updeep, u.omit(['selected', 'openPanel']), state);
		}

		// if (action.payload.path == null) return state;
	}

	// if we're focusing a new node, at-root unfocus the old focused node
	if (action.Is(ACTViewCenterChange) && action.payload.mapID == mapID) {
		const nodes = GetTreeNodesInObjTree(state, true);
		const focusNode = nodes.FirstOrX(a => a.Value && a.Value.focused);
		if (focusNode) {
			state = u.updateIn(focusNode.PathStr_Updeep, u.omit(['focused', 'viewOffset']), state);
		}
	}

	// regular (branching) reducer portion
	// ==========

	// if (action.Is(ACTMapNodeSelect) && action.payload.mapID == mapID) {
	if (action.IsAny(ACTMapNodeSelect, ACTMapNodePanelOpen, ACTMapNodeTermOpen, ACTMapNodeExpandedSet,
		ACTMapNodeChildLimitSet, ACTViewCenterChange) && action.payload.mapID == mapID) {
		const targetPath = GetTargetPath(action);
		if (targetPath) {
			const rootNodeID = SplitStringBySlash_Cached(targetPath)[0];
			state = { ...state, [rootNodeID]: MapNodeViewReducer(state[rootNodeID], action, `${rootNodeID}`) };
		}
	}

	return state;
}

function GetTargetPath(action: Action<any>) {
	return action.Is(ACTViewCenterChange) ? action.payload.focusNodePath : action.payload.path;
}

function MapNodeViewReducer(state = new MapNodeView(), action: Action<any>, pathSoFar: string, autoExpand = false) {
	const targetPath = GetTargetPath(action);
	const atTargetNode = targetPath == pathSoFar;
	const pastTargetNode = pathSoFar.length > targetPath.length;

	if (!atTargetNode && !pastTargetNode) {
		const nextNodeIDInPath = SplitStringBySlash_Cached(targetPath.substr(pathSoFar.length + 1))[0];
		// return {...state, children: {...state.children, [nextNodeIDInPath]: MapNodeViewReducer(state.children[nextNodeIDInPath], action, `${pathSoFar}/${nextNodeIDInPath}`)}};
		return u.updateIn(`children.${nextNodeIDInPath}`, MapNodeViewReducer((state.children || {})[nextNodeIDInPath], action, `${pathSoFar}/${nextNodeIDInPath}`), state);
	}

	if (autoExpand) {
		state = { ...state, expanded: true };
	}

	if (action.Is(ACTMapNodeSelect)) {
		state = { ...state, selected: true };
	} else if (action.Is(ACTMapNodePanelOpen)) {
		state = { ...state, openPanel: action.payload.panel };
	} else if (action.Is(ACTMapNodeTermOpen)) {
		state = { ...state, openTermID: action.payload.termID };
	} else if (action.Is(ACTMapNodeExpandedSet)) {
		const expandKey = ['expanded', 'expanded_truth', 'expanded_relevance'].find(key => action.payload[key] != null);
		if (atTargetNode) {
			state = { ...state, [expandKey]: action.payload[expandKey] };

			// if we're expanding the current node, and it's a claim, then auto-expand any argument children it has (assuming no expand state set yet)
			/* let currentNode = GetNodeL2(SplitStringBySlash_Cached(pathSoFar).Last().ToInt());
			if (action.payload[expandKey] && currentNode && currentNode.type == MapNodeType.Claim) {
				//for (let child of GetNodeChildrenL3(currentNode)) {
				state.children = {...state.children};
				for (let childID of currentNode.children.VKeys(true)) {
					//if (child && child.type == MapNodeType.Argument && DeepGet(state, `children.${child._id}.expanded`) == null) {
					if (DeepGet(state, `children.${childID}.expanded`) == null) {
						//state = u.updateIn(`children.${childID}.expanded`, u.constant(true), state);
						state.children[childID] = MapNodeViewReducer(state.children[childID], action, `${pathSoFar}/${childID}`, true);
					}
				}
			} */
		} else { // if past target-node
			state = { ...state, expanded: false, expanded_truth: false, expanded_relevance: false };
		}

		if (action.payload.recursive) {
			state.children = { ...state.children };
			for (const childID in state.children) {
				state.children[childID] = MapNodeViewReducer(state.children[childID], action, `${pathSoFar}/${childID}`);
			}
		}
	} else if (action.Is(ACTMapNodeChildLimitSet)) {
		state = { ...state, [`childLimit_${action.payload.direction}`]: action.payload.value };
	} else if (action.Is(ACTViewCenterChange)) {
		state = { ...state, focused: true, viewOffset: action.payload.viewOffset };
	}

	return state;
}
