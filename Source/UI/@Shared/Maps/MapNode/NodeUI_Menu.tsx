import { E } from 'js-vextensions';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { VMenuStub } from 'react-vmenu';
import { VMenuItem } from 'react-vmenu/dist/VMenu';
import { ShowMessageBox } from 'react-vmessagebox';
import { LinkNode_HighLevel, LinkNode_HighLevel_GetCommandError } from 'Server/Commands/LinkNode_HighLevel';
import { SetNodeIsMultiPremiseArgument } from 'Server/Commands/SetNodeIsMultiPremiseArgument';
import { UnlinkNode } from 'Server/Commands/UnlinkNode';
import { GetParentNodeID, HolderType } from 'Store/firebase/nodes';
import { ACTSetLastAcknowledgementTime, GetCopiedNodePath, GetOpenMapID } from 'Store/main';
import { GetTimeFromWhichToShowChangedNodes } from 'Store/main/maps/$map';
import { State, ACTSet, ActionSet } from 'Frame/Store/StoreHelpers';
import { SlicePath } from '../../../../Frame/Database/DatabaseHelpers';
import { Connect } from '../../../../Frame/Database/FirebaseConnect';
import { styles } from '../../../../Frame/UI/GlobalStyles';
import { DeleteNode } from '../../../../Server/Commands/DeleteNode';
import { RootState } from '../../../../Store';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { GetPathsToNodesChangedSinceX } from '../../../../Store/firebase/mapNodeEditTimes';
import { ForCopy_GetError, ForCut_GetError, ForDelete_GetError, ForUnlink_GetError, GetNodeChildrenL3, GetNodeID, GetParentNodeL3, IsNodeSubnode } from '../../../../Store/firebase/nodes';
import { GetNodeDisplayText, GetNodeL3, GetValidNewChildTypes, IsMultiPremiseArgument, IsPremiseOfSinglePremiseArgument, IsSinglePremiseArgument } from '../../../../Store/firebase/nodes/$node';
import { ClaimForm, MapNodeL3, Polarity } from '../../../../Store/firebase/nodes/@MapNode';
import { GetMapNodeTypeDisplayName, MapNodeType, MapNodeType_Info } from '../../../../Store/firebase/nodes/@MapNodeType';
import { CanGetBasicPermissions, IsUserCreatorOrMod } from '../../../../Store/firebase/userExtras';
import { GetUserID, GetUserPermissions } from '../../../../Store/firebase/users';
import { ACTNodeCopy, GetCopiedNode } from '../../../../Store/main';
import { ShowSignInPopup } from '../../NavBar/UserPanel';
import { ShowAddChildDialog } from './NodeUI_Menu/AddChildDialog';

export class NodeUI_Menu_Stub extends BaseComponent<Props, {}> {
	render() {
		const { ...rest } = this.props;
		return (
			<VMenuStub preOpen={e => e.passThrough != true}>
				<NodeUI_Menu {...rest}/>
			</VMenuStub>
		);
	}
}

type Props = {map?: Map, node: MapNodeL3, path: string, inList?: boolean, holderType?: HolderType};
type SharedProps = Props & Partial<{combinedWithParentArg: boolean, copiedNode: MapNodeL3, copiedNodePath: string, copiedNode_asCut: boolean}> & {};
const connector = (_: RootState, { map, node, path, holderType }: Props) => {
	let pathsToChangedInSubtree;
	if (map) {
		const sinceTime = GetTimeFromWhichToShowChangedNodes(map._id);
		const pathsToChangedNodes = GetPathsToNodesChangedSinceX(map._id, sinceTime);
		pathsToChangedInSubtree = pathsToChangedNodes.filter(a => a == path || a.startsWith(`${path}/`)); // also include self, for this
	}
	const parent = GetParentNodeL3(path);

	const copiedNode = GetCopiedNode();
	const copiedNodePath = GetCopiedNodePath();

	// if we're copying a (single-premise) argument into a place where it's supposed to be a claim, we have to paste just that inner claim
	/* if (copiedNode && copiedNode.type == MapNodeType.Argument && IsMultiPremiseArgument(node) && holderType == null) {
		copiedNode = GetNodeChildrenL3(copiedNode)[0];
		copiedNodePath = copiedNode ? `${copiedNodePath}/${copiedNode._id}` : null;
		// todo: ms old wrapper is also deleted (probably)
	} */

	// if we're copying a claim into a place where it's supposed to be an argument, pretend we had actually copied the parent-arg of it
	/* if (copiedNode && copiedNode.type == MapNodeType.Claim && holderType != null) {
		copiedNode = GetNodeL3(SlicePath(copiedNodePath, 1));
		copiedNodePath = SlicePath(copiedNodePath, 1);
	} */

	return {
		_: (ForUnlink_GetError(GetUserID(), node), ForDelete_GetError(GetUserID(), node)),
		// userID: GetUserID(), // not needed in Connect(), since permissions already watches its data
		permissions: GetUserPermissions(GetUserID()),
		parent,
		// nodeChildren: GetNodeChildrenL3(node, path),
		nodeChildren: GetNodeChildrenL3(node, path),
		combinedWithParentArg: IsPremiseOfSinglePremiseArgument(node, parent),
		copiedNode,
		copiedNodePath,
		copiedNode_asCut: State(a => a.main.copiedNodePath_asCut),
		pathsToChangedInSubtree,
	};
};
@Connect(connector)
export class NodeUI_Menu extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { map, node, path, inList, holderType,
			permissions, parent, nodeChildren, combinedWithParentArg, copiedNode, copiedNodePath, copiedNode_asCut, pathsToChangedInSubtree } = this.props;
		const mapID = map ? map._id : null;
		const userID = GetUserID();
		// let validChildTypes = MapNodeType_Info.for[node.type].childTypes;
		let validChildTypes = GetValidNewChildTypes(node, holderType, permissions);
		const componentBox = holderType != null;
		if (holderType) {
			validChildTypes = validChildTypes.Except(MapNodeType.Claim);
		} else {
			validChildTypes = validChildTypes.Except(MapNodeType.Argument);
		}

		const formForClaimChildren = node.type == MapNodeType.Category ? ClaimForm.YesNoQuestion : ClaimForm.Base;

		const nodeText = GetNodeDisplayText(node, path);

		const sharedProps = this.props;
		return (
			<div>
				{CanGetBasicPermissions(userID) && !inList && validChildTypes.map((childType) => {
					const childTypeInfo = MapNodeType_Info.for[childType];
					// let displayName = GetMapNodeTypeDisplayName(childType, node, form);
					const polarities = childType == MapNodeType.Argument ? [Polarity.Supporting, Polarity.Opposing] : [null];
					return polarities.map((polarity) => {
						const displayName = GetMapNodeTypeDisplayName(childType, node, ClaimForm.Base, polarity);
						return (
							<VMenuItem key={`${childType}_${polarity}`} text={`Add ${displayName}`} style={styles.vMenuItem}
								onClick={(e) => {
									if (e.button != 0) return;
									if (userID == null) return ShowSignInPopup();

									ShowAddChildDialog(node, path, childType, polarity, userID, mapID);
								}}/>
						);
					});
				})}
				{/* // IsUserBasicOrAnon(userID) && !inList && path.includes("/") && !path.includes("L") && !componentBox &&
				// for now, only let mods add layer-subnodes (confusing otherwise)
					HasModPermissions(userID) && !inList && path.includes('/') && !path.includes('L') && !componentBox
					&& <VMenuItem text="Add subnode (in layer)" style={styles.vMenuItem}
						onClick={(e) => {
							if (e.button != 0) return;
							if (userID == null) return ShowSignInPopup();
							ShowAddSubnodeDialog(mapID, node, path);
						}}/> */}
				{IsUserCreatorOrMod(userID, parent) && node.type == MapNodeType.Claim && IsSinglePremiseArgument(parent) && !componentBox
					&& <VMenuItem text="Convert to multi-premise" style={styles.vMenuItem}
						onClick={async (e) => {
							if (e.button != 0) return;

							/* let newNode = new MapNode({
								parents: {[parent._id]: {_: true}},
								type: MapNodeType.Claim,
							});
							let newRevision = new MapNodeRevision({titles: {base: "Second premise (click to edit)"}});
							let newLink = {_: true, form: ClaimForm.Base} as ChildEntry;

							SetNodeUILocked(parent._id, true);
							let info = await new AddChildNode({mapID: mapID, node: newNode, revision: newRevision, link: newLink}).Run();
							store.dispatch(new ACTMapNodeExpandedSet({mapID: mapID, path: path + "/" + info.nodeID, expanded: true, recursive: false}));
							store.dispatch(new ACTSetLastAcknowledgementTime({nodeID: info.nodeID, time: Date.now()}));

							await WaitTillPathDataIsReceiving(`nodeRevisions/${info.revisionID}`);
							await WaitTillPathDataIsReceived(`nodeRevisions/${info.revisionID}`);
							SetNodeUILocked(parent._id, false); */

							await new SetNodeIsMultiPremiseArgument({ nodeID: parent._id, multiPremiseArgument: true }).Run();
						}}/>}
				{IsUserCreatorOrMod(userID, node) && IsMultiPremiseArgument(node)
					&& nodeChildren.every(a => a != null) && nodeChildren.filter(a => a.type == MapNodeType.Claim).length == 1 && !componentBox
					&& <VMenuItem text="Convert to single-premise" style={styles.vMenuItem}
						onClick={async (e) => {
							if (e.button !== 0) return;

							await new SetNodeIsMultiPremiseArgument({ nodeID: node._id, multiPremiseArgument: false }).Run();
						}}/>}
				{pathsToChangedInSubtree && pathsToChangedInSubtree.length > 0 && !componentBox
					&& <VMenuItem text="Mark subtree as viewed" style={styles.vMenuItem}
						onClick={(e) => {
							if (e.button != 0) return;
							for (const path of pathsToChangedInSubtree) {
								store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: GetNodeID(path), time: Date.now() }));
							}
						}}/>}
				{inList && GetOpenMapID() != null
					&& <VMenuItem text="Find in map" style={styles.vMenuItem}
						onClick={(e) => {
							store.dispatch(new ActionSet(
								new ACTSet(a => a.main.search.findNode_state, 'activating'),
								new ACTSet(a => a.main.search.findNode_node, node._id),
								new ACTSet(a => a.main.search.findNode_resultPaths, []),
							));
						}}/>}
				{!inList && !componentBox
					&& <VMenuItem text={copiedNode ? <span>Cut <span style={{ fontSize: 10, opacity: 0.7 }}>(right-click to clear)</span></span> as any : 'Cut'}
						enabled={ForCut_GetError(userID, node) == null} title={ForCut_GetError(userID, node)}
						style={styles.vMenuItem}
						onClick={(e) => {
							e.persist();
							if (e.button == 2) {
								store.dispatch(new ACTNodeCopy({ path: null, asCut: true }));
								return;
							}

							/* let pathToCut = path;
							if (node.type == MapNodeType.Claim && combinedWithParentArg) {
								pathToCut = SlicePath(path, 1);
							} */

							store.dispatch(new ACTNodeCopy({ path, asCut: true }));
						}}/>}
				{!componentBox
					&& <VMenuItem text={copiedNode ? <span>Copy <span style={{ fontSize: 10, opacity: 0.7 }}>(right-click to clear)</span></span> as any : 'Copy'} style={styles.vMenuItem}
						enabled={ForCopy_GetError(userID, node) == null} title={ForCopy_GetError(userID, node)}
						onClick={(e) => {
							e.persist();
							if (e.button == 2) {
								return void store.dispatch(new ACTNodeCopy({ path: null, asCut: false }));
							}

							/* let pathToCopy = path;
							if (node.type == MapNodeType.Claim && combinedWithParentArg) {
								pathToCopy = SlicePath(path, 1);
							} */

							store.dispatch(new ACTNodeCopy({ path, asCut: false }));
						}}/>}
				<PasteAsLink_MenuItem {...sharedProps}/>
				{/* // disabled for now, since I need to create a new command to wrap the logic. One route: create a CloneNode_HighLevel command, modeled after LinkNode_HighLevel (or containing it as a sub)
					IsUserBasicOrAnon(userID) && copiedNode && IsNewLinkValid(GetParentNodeID(path), copiedNode.Extended({ _id: -1 }), permissions, holderType) && !copiedNode_asCut
					&& <VMenuItem text={`Paste as clone: "${GetNodeDisplayText(copiedNode, null, formForClaimChildren).KeepAtMost(50)}"`} style={styles.vMenuItem} onClick={async (e) => {
						if (e.button != 0) return;
						if (userID == null) return ShowSignInPopup();

						const baseNodePath = State(a => a.main.copiedNodePath);
						const baseNodePath_ids = GetPathNodeIDs(baseNodePath);
						const info = await new CloneNode({ mapID: mapID, baseNodePath, newParentID: node._id }).Run();

						store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: info.nodeID, time: Date.now() }));

						if (copiedNode_asCut) {
							await new UnlinkNode({ mapID: mapID, parentID: baseNodePath_ids.XFromLast(1), childID: baseNodePath_ids.Last() }).Run();
						}
					}}/> */}
				<UnlinkContainerArgument_MenuItem {...sharedProps}/>
				{IsUserCreatorOrMod(userID, node) && !inList && !componentBox
					&& <VMenuItem text={`Unlink${combinedWithParentArg ? ' claim' : ''}`}
						enabled={ForUnlink_GetError(userID, node) == null} title={ForUnlink_GetError(userID, node)}
						style={styles.vMenuItem} onClick={async (e) => {
							if (e.button != 0) return;
							/* let error = ForUnlink_GetError(userID, node);
							if (error) {
								return void ShowMessageBox({title: `Cannot unlink`, message: error});
							} */

							/* let parentNodes = await GetNodeParentsAsync(node);
							if (parentNodes.length <= 1) { */
							/* if (node.parents.VKeys(true).length <= 1) {
								return void ShowMessageBox({title: `Cannot unlink`, message: `Cannot unlink this child, as doing so would orphan it. Try deleting it instead.`});
							} */

							// let parent = parentNodes[0];
							const parentText = GetNodeDisplayText(parent, path.substr(0, path.lastIndexOf('/')));
							ShowMessageBox({
								title: `Unlink child "${nodeText}"`, cancelButton: true,
								message: `Unlink the child "${nodeText}" from its parent "${parentText}"?`,
								onOK: () => {
									new UnlinkNode({ mapID, parentID: parent._id, childID: node._id }).Run();
								},
							});
						}}/>}
				<DeleteContainerArgument_MenuItem {...sharedProps}/>
				{IsUserCreatorOrMod(userID, node) && !componentBox
					&& <VMenuItem text={`Delete${combinedWithParentArg ? ' claim' : ''}`}
						enabled={ForDelete_GetError(userID, node) == null} title={ForDelete_GetError(userID, node)}
						style={styles.vMenuItem} onClick={(e) => {
							if (e.button != 0) return;

							const contextStr = IsNodeSubnode(node) ? ', and its placement in-layer' : ', and its link with 1 parent';

							ShowMessageBox({
								title: `Delete "${nodeText}"`, cancelButton: true,
								message: `Delete the node "${nodeText}"${contextStr}?`,
								onOK: async () => {
									await new DeleteNode(E({ mapID: map ? mapID : null, nodeID: node._id })).Run();
								},
							});
						}}/>}
			</div>
		);
	}
}

/* let PasteAsLink_MenuItem_connector = (state, {}: SharedProps)=> {
	let moveOpPayload = {};
	let valid = IsUserBasicOrAnon(GetUserID()) && copiedNode != null && IsMoveNodeOpValid(moveOpPayload);
	return {valid};
};
@Connect(connector)
class PasteAsLink_MenuItem extends BaseComponentWithConnector(PasteAsLink_MenuItem_connector, {}) { */
class PasteAsLink_MenuItem extends BaseComponent<SharedProps, {}> {
	render() {
		const { map, node, path, holderType, copiedNode, copiedNodePath, copiedNode_asCut, combinedWithParentArg, inList } = this.props;
		if (!CanGetBasicPermissions('me')) return <div/>;
		if (copiedNode == null) return <div/>;
		if (inList) return <div/>;
		const copiedNode_parent = GetParentNodeL3(copiedNodePath);

		const formForClaimChildren = node.type == MapNodeType.Category ? ClaimForm.YesNoQuestion : ClaimForm.Base;
		const linkCommand = new LinkNode_HighLevel({
			mapID: map._id, oldParentID: GetParentNodeID(copiedNodePath), newParentID: node._id, nodeID: copiedNode._id,
			newForm: copiedNode.type == MapNodeType.Claim ? formForClaimChildren : null,
			newPolarity:
				(copiedNode.type == MapNodeType.Argument ? copiedNode.link.polarity : null) // if node itself has polarity, use it
				|| (copiedNode_parent && copiedNode_parent.type == MapNodeType.Argument ? copiedNode_parent.link.polarity : null), // else if our parent has a polarity, use that
			allowCreateWrapperArg: holderType != null || !node.multiPremiseArgument,
			unlinkFromOldParent: copiedNode_asCut, deleteOrphanedArgumentWrapper: true,
		});
		const error = LinkNode_HighLevel_GetCommandError(linkCommand);

		return (
			<VMenuItem text={`Paste${copiedNode_asCut ? '' : ' as link'}: "${GetNodeDisplayText(copiedNode, null, formForClaimChildren).KeepAtMost(50)}"`}
				enabled={error == null} title={error}
				style={styles.vMenuItem} onClick={(e) => {
					if (e.button != 0) return;
					if (GetUserID() == null) return ShowSignInPopup();

					if (copiedNode.type == MapNodeType.Argument && !copiedNode_asCut) {
						// eslint-disable-next-line
						return void ShowMessageBox({
							title: 'Argument at two locations?', cancelButton: true, onOK: proceed,
							message: `
								Are you sure you want to paste this argument as a linked child?

								Only do this if you're sure that the impact-premise applies exactly the same to both the old parent and the new parent. (usually it does not, ie. usually it's specific to its original parent claim)

								If not, paste the argument as a clone instead.
							`.AsMultiline(0),
						});
					}
					proceed();

					async function proceed() {
						const { argumentWrapperID } = await linkCommand.Run();
						if (argumentWrapperID) {
							store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: argumentWrapperID, time: Date.now() }));
						}
					}
				}}/>
		);
	}
}

class UnlinkContainerArgument_MenuItem extends BaseComponent<SharedProps, {}> {
	render() {
		const { map, node, path, holderType, combinedWithParentArg } = this.props;
		if (!combinedWithParentArg) return <div/>;
		const componentBox = holderType != null;
		if (componentBox) return <div/>;

		const argumentPath = SlicePath(path, 1);
		const argument = GetNodeL3(argumentPath);
		const argumentText = GetNodeDisplayText(argument, argumentPath);
		const forUnlink_error = ForUnlink_GetError(GetUserID(), argument);
		if (!IsUserCreatorOrMod('me', argument)) return <div/>;

		const argumentParentPath = SlicePath(argumentPath, 1);
		const argumentParent = GetNodeL3(argumentParentPath);

		return (
			<VMenuItem text="Unlink argument" enabled={forUnlink_error == null} title={forUnlink_error}
				style={styles.vMenuItem} onClick={(e) => {
					if (e.button != 0) return;

					ShowMessageBox({
						title: `Unlink "${argumentText}"`, cancelButton: true,
						message: `Unlink the argument "${argumentText}"?`,
						onOK: async () => {
							new UnlinkNode({ mapID: map ? map._id : null, parentID: argumentParent._id, childID: argument._id }).Run();
						},
					});
				}}/>
		);
	}
}

class DeleteContainerArgument_MenuItem extends BaseComponent<SharedProps, {}> {
	render() {
		const { map, node, path, holderType, combinedWithParentArg } = this.props;
		const mapID = map ? map._id : null;
		if (!combinedWithParentArg) return <div/>;
		const componentBox = holderType != null;
		if (componentBox) return <div/>;

		const argumentPath = SlicePath(path, 1);
		const argument = GetNodeL3(argumentPath);
		const argumentText = GetNodeDisplayText(argument, argumentPath);
		const forDelete_error = ForDelete_GetError(GetUserID(), argument, { childrenBeingDeleted: [node._id] });
		if (!IsUserCreatorOrMod('me', argument)) return <div/>;

		const canDeleteBaseClaim = IsUserCreatorOrMod(GetUserID(), node);
		const baseClaim_action = node.parents.VKeys(true).length > 1 || !canDeleteBaseClaim ? 'unlink' : 'delete';
		const forBaseClaimAction_error = baseClaim_action == 'unlink' ? ForUnlink_GetError(GetUserID(), node) : ForDelete_GetError(GetUserID(), node);

		return (
			<VMenuItem text="Delete argument" enabled={forDelete_error == null && forBaseClaimAction_error == null} title={forDelete_error || baseClaim_action}
				style={styles.vMenuItem} onClick={(e) => {
					if (e.button != 0) return;

					ShowMessageBox({
						title: `Delete "${argumentText}"`, cancelButton: true,
						message: `Delete the argument "${argumentText}", and ${baseClaim_action} its base-claim?`,
						onOK: async () => {
							// if deleting single-premise argument, first delete or unlink the base-claim
							if (baseClaim_action == 'unlink') {
								await new UnlinkNode({ mapID, parentID: argument._id, childID: node._id }).Run();
							} else if (baseClaim_action == 'delete') {
								await new DeleteNode({ mapID, nodeID: node._id }).Run();
							}

							await new DeleteNode(E({ mapID, nodeID: argument._id })).Run();
						},
					});
				}}/>
		);
	}
}
