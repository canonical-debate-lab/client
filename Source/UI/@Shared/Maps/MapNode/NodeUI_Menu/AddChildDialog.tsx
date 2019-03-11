import { E, GetErrorMessagesUnderElement, GetEntries } from 'js-vextensions';
import { Column, Pre, Row, Select, TextArea } from 'react-vcomponents';
import { GetInnerComp } from 'react-vextensions';
import { BoxController, ShowMessageBox } from 'react-vmessagebox';
import { HasModPermissions } from 'Store/firebase/userExtras';
import { AddArgumentAndClaim } from 'Server/Commands/AddArgumentAndClaim';
import { Link, ACTSet } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { AddChildNode } from '../../../../../Server/Commands/AddChildNode';
import { ContentNode } from '../../../../../Store/firebase/contentNodes/@ContentNode';
import { AsNodeL2, AsNodeL3, GetClaimType, GetNodeForm } from '../../../../../Store/firebase/nodes/$node';
import { Equation } from '../../../../../Store/firebase/nodes/@Equation';
import { ChildEntry, ClaimForm, ClaimType, ImageAttachment, MapNode, MapNodeL3, Polarity } from '../../../../../Store/firebase/nodes/@MapNode';
import { ArgumentType, MapNodeRevision, MapNodeRevision_titlePattern } from '../../../../../Store/firebase/nodes/@MapNodeRevision';
import { GetMapNodeTypeDisplayName, MapNodeType, MapNodeType_Info } from '../../../../../Store/firebase/nodes/@MapNodeType';
import { ACTSetLastAcknowledgementTime } from '../../../../../Store/main';
import { ACTMapNodeExpandedSet } from '../../../../../Store/main/mapViews/$mapView/rootNodeViews';
import { NodeDetailsUI } from '../NodeDetailsUI';

export function ShowAddChildDialog(parentNode: MapNodeL3, parentPath: string, childType: MapNodeType, childPolarity: Polarity, userID: string, mapID: string) {
	const parentForm = GetNodeForm(parentNode);
	const childTypeInfo = MapNodeType_Info.for[childType];
	const displayName = GetMapNodeTypeDisplayName(childType, parentNode, parentForm, childPolarity);

	const claimForm = childType == MapNodeType.Claim
		? (parentNode.type == MapNodeType.Category ? ClaimForm.YesNoQuestion : ClaimForm.Base)
		: null;

	let newNode = new MapNode({
		parents: { [parentNode._key]: { _: true } },
		type: childType,
	});
	let newRevision = new MapNodeRevision({});
	let newLink = E(
		{ _: true },
		childType == MapNodeType.Claim && { form: claimForm },
		childType == MapNodeType.Argument && { polarity: childPolarity },
	) as ChildEntry;
	if (childType == MapNodeType.Argument) {
		newRevision.argumentType = ArgumentType.All;
		var newPremise = new MapNode({ type: MapNodeType.Claim, creator: userID });
		var newPremiseRevision = new MapNodeRevision({});
	}

	let root;
	let justShowed = true;
	let nodeEditorUI: NodeDetailsUI;
	let validationError = 'No data entered yet.';
	const Change = (..._) => boxController.UpdateUI();
	let boxController: BoxController = ShowMessageBox({
		title: `Add ${displayName}`, cancelButton: true,
		message: () => {
			setTimeout(() => justShowed = false);
			boxController.options.okButtonClickable = validationError == null;

			const claimTypes = GetEntries(ClaimType);
			if (!HasModPermissions(userID)) {
				claimTypes.Remove(claimTypes.find(a => a.value == ClaimType.Image));
			}

			const newNodeAsL2 = AsNodeL2(newNode, newRevision);
			return (
				<Column ref={c => root = c} style={{ width: 600 }}>
					{childType == MapNodeType.Claim &&
						<Row>
							<Pre>Type: </Pre>
							<Select displayType="button bar" options={claimTypes} style={{ display: 'inline-block' }}
								value={GetClaimType(newNodeAsL2)}
								onChange={(val) => {
									newRevision.Extend({ equation: null, contentNode: null, image: null });
									if (val == ClaimType.Normal) {
									} else if (val == ClaimType.Equation) {
										newRevision.equation = new Equation();
									} else if (val == ClaimType.Quote) {
										newRevision.contentNode = new ContentNode();
									} else {
										newRevision.image = new ImageAttachment();
									}
									Change();

									const oldError = validationError;
									setTimeout(() => {
										validationError = nodeEditorUI.GetValidationError();
										if (validationError != oldError) {
											Change();
										}
									});
								}}/>
						</Row>}
					{childType != MapNodeType.Argument &&
						<NodeDetailsUI ref={c => nodeEditorUI = c} style={{ padding: childType == MapNodeType.Claim ? '5px 0 0 0' : 0 }}
							baseData={AsNodeL3(newNodeAsL2, Polarity.Supporting, null)}
							baseRevisionData={newRevision}
							baseLinkData={newLink} forNew={true}
							parent={parentNode}
							onChange={(newNodeData, newRevisionData, newLinkData, comp) => {
								newNode = newNodeData;
								newRevision = newRevisionData;
								newLink = newLinkData;
								validationError = comp.GetValidationError();
								Change();
							}}/>}
					{childType == MapNodeType.Argument &&
						<Column>
							{/* <Row style={{display: "flex", alignItems: "center"}}>
								<Pre>Title: </Pre>
								<InfoButton text={`
An argument title should be a short "key phrase" that gives the gist of the argument, for easy remembering/scanning.

Examples:
* Shadow during lunar eclipses
* May have used biased sources
* Quote: Socrates

The details of the argument should be described within the argument's premises. (the first premise can be typed in below)
								`.trim()}/><Pre> </Pre>
								{/*<TextArea_AutoSize required={true} pattern={MapNodeRevision_titlePattern}
									allowLineBreaks={false} style={ES({flex: 1})}
									//ref={a=>a && this.lastRender_source == RenderSource.Mount && WaitXThenRun(0, ()=>a.DOM.focus())}
									value={newRevision.titles["base"]} onChange={val=>Change(newRevision.titles["base"] = val)}/>*#/}
								<TextInput style={ES({flex: 1})} required={true} pattern={MapNodeRevision_titlePattern}
									//ref={a=>a && forNew && this.lastRender_source == RenderSource.Mount && WaitXThenRun(0, ()=>a.DOM.focus())}
									value={newRevision.titles["base"]}
									onChange={val=>Change(newRevision.titles["base"] = val, validationError = GetErrorMessagesUnderElement(root.DOM)[0])}/>
							</Row> */}
							<Row style={{ display: 'flex', alignItems: 'center' }}>
								<Pre>Main claim (ie. premise) that your argument will be based on: </Pre>
								<Link to="https://en.wikipedia.org/wiki/Premise" style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>What is a premise?</Link>
								{/* <InfoButton text={`
								`.trim()}/> */}
							</Row>
							<Row style={{ display: 'flex', alignItems: 'center' }}>
								<TextArea required={true} pattern={MapNodeRevision_titlePattern}
									allowLineBreaks={false} autoSize={true} style={ES({ flex: 1 })}
									value={newPremiseRevision.titles['base']}
									onChange={val => Change(newPremiseRevision.titles['base'] = val, validationError = GetErrorMessagesUnderElement(root.DOM)[0])}/>
							</Row>
							<Row mt={5} style={{ fontSize: 12 }}>To add a second premise later, right click on your new argument and press "Convert to multi-premise".</Row>
						</Column>}
				</Column>
			);
		},
		onOK: async () => {
			/* if (validationError) {
				return void setTimeout(()=>ShowMessageBox({title: `Validation error`, message: `Validation error: ${validationError}`}));
			} */
			store.dispatch(new ACTSet(a => a.main.currentNodeBeingAdded_path, `${parentPath}/?`));

			if (childType == MapNodeType.Argument) {
				const info = await new AddArgumentAndClaim({
					mapID,
					argumentParentID: newNode.parents.VKeys(true)[0], argumentNode: newNode.Excluding('parents') as MapNode, argumentRevision: newRevision, argumentLink: newLink,
					claimNode: newPremise, claimRevision: newPremiseRevision,
				}).Run();
				store.dispatch(new ACTMapNodeExpandedSet({ mapID, path: `${parentPath}/${info.argumentNodeID}`, expanded: true, recursive: false }));
				store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: info.argumentNodeID, time: Date.now() }));
				store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: info.claimNodeID, time: Date.now() }));
			} else {
				const info = await new AddChildNode({
					mapID, parentID: newNode.parents.VKeys(true)[0], node: newNode.Excluding('parents') as MapNode, revision: newRevision, link: newLink,
				}).Run();
				store.dispatch(new ACTMapNodeExpandedSet({ mapID, path: `${parentPath}/${info.nodeID}`, expanded: true, recursive: false }));
				store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: info.nodeID, time: Date.now() }));
			}

			store.dispatch(new ACTSet(a => a.main.currentNodeBeingAdded_path, null));
		},
	});
}
