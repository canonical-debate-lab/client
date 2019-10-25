import { Assert, Clone } from 'js-vextensions';
import keycode from 'keycode';
import { useState, forwardRef, useImperativeHandle, Ref } from 'react';
import { useSelector } from 'react-redux';
import { Button, Pre, Row, TextArea } from 'react-vcomponents';
import { FilterOutUnrecognizedProps } from 'react-vextensions';
import { AddNodeRevision } from 'Server/Commands/AddNodeRevision';
import { Map } from 'Store/firebase/maps/@Map';
import { GetParentNode, IsNodeSubnode } from 'Store/firebase/nodes';
import { GetFontSizeForNode, GetNodeDisplayText, GetNodeForm, missingTitleStrings } from 'Store/firebase/nodes/$node';
import { GetEquationStepNumber } from 'Store/firebase/nodes/$node/equation';
import { ClaimForm, MapNodeL2 } from 'Store/firebase/nodes/@MapNode';
import { MapNodeRevision_titlePattern } from 'Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { MeID } from 'Store/firebase/users';
import { ACTSetLastAcknowledgementTime } from 'Store/main';
import { ACTMapNodePanelOpen, ACTMapNodeTermOpen } from 'Store/main/mapViews/$mapView/rootNodeViews';
import { MapNodeView } from 'Store/main/mapViews/@MapViews';
import { DBPath, InfoButton, IsDoubleClick, ParseSegmentsForPatterns, RemoveHelpers, VReactMarkdown_Remarkable, WaitTillPathDataIsReceived } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { NodeMathUI } from '../NodeMathUI';
import { SetNodeUILocked } from '../NodeUI';
import { NodeUI_Inner } from '../NodeUI_Inner';
import { TermPlaceholder } from './TermPlaceholder';

/* type TitlePanelProps = {parent: NodeUI_Inner, map: Map, node: MapNodeL2, nodeView: MapNodeView, path: string, indexInNodeList: number, style};
const TitlePanel_connector = (state, { node, path }: TitlePanelProps) => ({
	displayText: GetNodeDisplayText(node, path),
	$1: node.current.image && GetImage(node.current.image.id),
	equationNumber: node.current.equation ? GetEquationStepNumber(path) : null,
});
@Connect(TitlePanel_connector)
// export class TitlePanel extends BaseComponentWithConnector(TitlePanel_connector, { editing: false, newTitle: null as string, applyingEdit: false }) { */

/* export type TitlePanelInternals = {OnDoubleClick};
export function TitlePanel(props: VProps<TitlePanelInternals, {
	parent: NodeUI_Inner, map: Map, node: MapNodeL2, nodeView: MapNodeView, path: string, indexInNodeList: number, style,
}>) { */

export const TitlePanel = forwardRef((props: {parent: NodeUI_Inner, map: Map, node: MapNodeL2, nodeView: MapNodeView, path: string, indexInNodeList: number, style}, ref: Ref<{OnDoubleClick}>) => {
	// const { map, parent, node, nodeView, path, displayText, equationNumber, style, ...rest } = this.props;
	const { map, parent, node, nodeView, path, style, ...rest } = props;

	// if (exposer) exposer({ OnDoubleClick });
	useImperativeHandle(ref, () => ({ OnDoubleClick }));

	const latex = node.current.equation && node.current.equation.latex;
	const isSubnode = IsNodeSubnode(node);

	const displayText = useSelector(() => GetNodeDisplayText(node, path));
	const equationNumber = useSelector(() => (node.current.equation ? GetEquationStepNumber(path) : null));

	// let { editing, newTitle, applyingEdit } = this.state;
	const [editing, setEditing] = useState(false);
	function OnDoubleClick() {
		const creatorOrMod = IsUserCreatorOrMod(MeID(), node);
		if (creatorOrMod && node.current.equation == null) {
			setEditing(true);
		}
	}
	// this.OnDoubleClick = OnDoubleClick; // is this safe?

	let [newTitle, setNewTitle] = useState(null as string);
	const [applyingEdit, setApplyingEdit] = useState(false);
	newTitle = newTitle != null ? newTitle : displayText;

	const noteText = (node.current.equation && node.current.equation.explanation) || node.current.note;

	async function ApplyEdit() {
		setApplyingEdit(true);

		const parentNode = GetParentNode(path);

		const form = GetNodeForm(node, path);
		const titleKey = { [ClaimForm.Negation]: 'negation', [ClaimForm.YesNoQuestion]: 'yesNoQuestion' }[form] || 'base';
		const newRevision = Clone(node.current);
		if (newRevision.titles[titleKey] != newTitle) {
			newRevision.titles[titleKey] = newTitle;

			if (parentNode) SetNodeUILocked(parentNode._key, true);
			const revisionID = await new AddNodeRevision({ mapID: map._key, revision: RemoveHelpers(newRevision) }).Run();
			store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: node._key, time: Date.now() }));
			// await WaitTillPathDataIsReceiving(DBPath(`nodeRevisions/${revisionID}`));
			await WaitTillPathDataIsReceived(DBPath(`nodeRevisions/${revisionID}`));
			if (parentNode) SetNodeUILocked(parentNode._key, false);
		}
		setApplyingEdit(false);
		setEditing(false);
	}

	function OnTermHover(termID: string, hovered: boolean) {
		parent.SetState({ hoverPanel: hovered ? 'definitions' : null, hoverTermID: hovered ? termID : null });
	}
	function OnTermClick(termID: string) {
		// parent.SetState({hoverPanel: "definitions", hoverTermID: termID});
		store.dispatch(new ACTMapNodePanelOpen({ mapID: map._key, path, panel: 'definitions' }));
		store.dispatch(new ACTMapNodeTermOpen({ mapID: map._key, path, termID }));
	}

	function RenderNodeDisplayText(text: string) {
		// let segments = ParseSegmentsFromNodeDisplayText(text);
		const segments = ParseSegmentsForPatterns(text, [
			{ name: 'term', regex: /{(.+?)\}\[(.+?)\]/ },
		]);

		const elements = [];
		for (const [index, segment] of segments.entries()) {
			if (segment.patternMatched == null) {
				const segmentText = segment.textParts[0];
				const edgeWhiteSpaceMatch = segmentText.match(/^( *).*?( *)$/);
				if (edgeWhiteSpaceMatch[1]) elements.push(<span key={elements.length}>{edgeWhiteSpaceMatch[1]}</span>);
				elements.push(
					<VReactMarkdown_Remarkable key={elements.length} containerType="span" source={segmentText}
						rendererOptions={{
							components: {
								p: props => <span>{props.children}</span>,
							},
						}}/>,
				);
				if (edgeWhiteSpaceMatch[2]) elements.push(<span key={elements.length}>{edgeWhiteSpaceMatch[2]}</span>);
			} else if (segment.patternMatched == 'term') {
				const refText = segment.textParts[1];
				const termID = segment.textParts[2];
				elements.push(
					<TermPlaceholder key={elements.length} refText={refText} termID={termID}
						onHover={hovered => OnTermHover(termID, hovered)} onClick={() => OnTermClick(termID)}/>,
				);
			} else {
				Assert(false);
			}
		}
		return elements;
	}

	return (
		// <Row style={{position: "relative"}}>
		<div {...FilterOutUnrecognizedProps(rest, 'div')} style={E({ position: 'relative', cursor: 'pointer', fontSize: GetFontSizeForNode(node, isSubnode) }, style)} onClick={e => IsDoubleClick(e) && OnDoubleClick()}>
			{equationNumber != null &&
				<Pre>{equationNumber}) </Pre>}
			{!editing &&
				<span style={E(
					{ position: 'relative', whiteSpace: 'initial' },
					isSubnode && { margin: '4px 0 1px 0' },
					missingTitleStrings.Contains(newTitle) && { color: 'rgba(255,255,255,.3)' },
				)}>
					{latex && <NodeMathUI text={node.current.equation.text} onTermHover={OnTermHover} onTermClick={OnTermClick}/>}
					{!latex && RenderNodeDisplayText(newTitle)}
				</span>}
			{editing &&
				<Row style={E(
					{ position: 'relative', whiteSpace: 'initial', alignItems: 'stretch' },
					isSubnode && { margin: '4px 0 1px 0' },
				)}>
					{!applyingEdit &&
						<TextArea required={true} pattern={MapNodeRevision_titlePattern} allowLineBreaks={false} autoSize={true} style={ES({ flex: 1 })}
							ref={a => a && a.DOM_HTML.focus()}
							onKeyDown={(e) => {
								if (e.keyCode == keycode.codes.esc) {
									setEditing(false);
								} else if (e.keyCode == keycode.codes.enter) {
									ApplyEdit();
								}
							}}
							value={newTitle} onChange={val => setNewTitle(val)}/>}
					{!applyingEdit &&
						<Button enabled={newTitle.match(MapNodeRevision_titlePattern) != null} text="✔️" p="0 3px" style={{ borderRadius: '0 5px 5px 0' }}
							onClick={() => ApplyEdit()}/>}
					{applyingEdit && <Row>Applying edit...</Row>}
				</Row>}
			{noteText &&
				<Pre style={{
					fontSize: 11, color: 'rgba(255,255,255,.5)',
					// marginLeft: "auto",
					marginLeft: 15, marginTop: 3, float: 'right',
				}}>
					{noteText}
				</Pre>}
			{node.type == MapNodeType.Claim && node.current.contentNode &&
				<InfoButton text="Allowed exceptions are: bold and [...] (collapsed segments)"/>}
		</div>
	);
});
