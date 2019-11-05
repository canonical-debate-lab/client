import { GetTreeNodesInObjTree, Vector2i } from 'js-vextensions';
import u from 'updeep';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { Action, SplitStringBySlash_Cached } from '../../../../Utils/FrameworkOverrides';
import { MapNodeView } from '../@MapViews';
import { RootNodeViews } from './rootNodeViews/@RootNodeViews';

export class ACTMapNodeSelect extends Action<{mapID: string, path: string}> {}
export class ACTMapNodePanelOpen extends Action<{mapID: string, path: string, panel: string}> {}
export class ACTMapNodeExpandedSet extends Action<{
	mapID: string, path: string, recursive: boolean
	expanded?: boolean, expanded_truth?: boolean, expanded_relevance?: boolean
}> {}
export class ACTMapNodeChildLimitSet extends Action<{mapID: string, path: string, direction: 'down' | 'up', value: number}> {}
export class ACTMapNodeTermOpen extends Action<{mapID: string, path: string, termID: string}> {}

export class ACTViewCenterChange extends Action<{mapID: string, focusNodePath: string, viewOffset: Vector2i}> {}

export function RootNodeViewsReducer(state = new RootNodeViews(), action: Action<any>, mapID: string) {
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
	const levelsPastTargetNode = pathSoFar.length - targetPath.length;

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
		const expandKeysPresent = ['expanded', 'expanded_truth', 'expanded_relevance'].filter(key => action.payload[key] != null);
		if (atTargetNode) {
			// state = { ...state, [expandKey]: action.payload[expandKey] };
			state = { ...state, ...action.payload.Including(...expandKeysPresent) };

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
		}
		// if past target-node
		else {
			// and action is recursive (ie. supposed to apply past target-node), with expansion being set to false
			if (action.payload.recursive && action.payload.Including(...expandKeysPresent).VValues().every(newVal => newVal == false)) {
				state = { ...state, expanded: false, expanded_truth: false, expanded_relevance: false }; // set all expansion keys to false (key might be different on clicked node than descendants)
				// state = { ...state, ...action.payload.Including(...expandKeysPresent) };
			}
		}

		if (action.payload.recursive) {
			state.children = { ...state.children };
			const childrenToRecurseInto = state.children.Pairs(true);
			/* let childrenToRecurseInto = state.children.Pairs(true).filter(pair=> {
				if (levelsPastTargetNode == 0) {
					//if (pair.value.linkType == "relevance argument") return action.payload
					if (pair.value.type == MapNodeType.) return action.payload
				}
				return true;
			}); */
			for (const childID of childrenToRecurseInto.map(a => a.key)) {
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
