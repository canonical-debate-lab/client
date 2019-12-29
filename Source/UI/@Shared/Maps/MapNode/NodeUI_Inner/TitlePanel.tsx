import { Assert, Clone, E } from 'js-vextensions';
import keycode from 'keycode';
import { forwardRef, Ref } from 'react';
import { Button, Pre, Row, TextArea } from 'react-vcomponents';
import { FilterOutUnrecognizedProps, UseImperativeHandle, UseState, Wrap, BaseComponentPlus, WarnOfTransientObjectProps } from 'react-vextensions';
import { AddNodeRevision } from 'Server/Commands/AddNodeRevision';
import { Map } from 'Store/firebase/maps/@Map';
import { GetParentNode, IsNodeSubnode } from 'Store/firebase/nodes';
import { GetFontSizeForNode, GetNodeDisplayText, GetNodeForm, missingTitleStrings } from 'Store/firebase/nodes/$node';
import { GetEquationStepNumber } from 'Store/firebase/nodes/$node/equation';
import { ClaimForm, MapNodeL2 } from 'Store/firebase/nodes/@MapNode';
import { MapNodeRevision_titlePattern } from 'Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from 'Store/firebase/nodes/@MapNodeType';
import { IsUserCreatorOrMod } from 'Store/firebase/userExtras';
import { MeID, CanEditNode } from 'Store/firebase/users';
import { InfoButton, IsDoubleClick, ParseSegmentsForPatterns, VReactMarkdown_Remarkable, Observer } from 'vwebapp-framework';
import { ES } from 'Utils/UI/GlobalStyles';
import { store } from 'Store';
import { MapNodeView, GetNodeViewsAlongPath, GetNodeView } from 'Store/main/maps/mapViews/$mapView';
import { runInAction } from 'mobx';
import { NodeMathUI } from '../NodeMathUI';
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

@WarnOfTransientObjectProps
@Observer
export class TitlePanel extends BaseComponentPlus(
	{} as {parent: NodeUI_Inner, map: Map, node: MapNodeL2, path: string, indexInNodeList: number, style},
	{ newTitle: null as string, editing: false, applyingEdit: false },
) {
	OnDoubleClick = () => {
		const { node } = this.props;
		/* const creatorOrMod = IsUserCreatorOrMod(MeID(), node);
		if (creatorOrMod && node.current.equation == null) { */
		if (CanEditNode(MeID(), node._key) && node.current.equation == null) {
			this.SetState({ editing: true });
		}
	};

	OnTermHover = (termID: string, hovered: boolean) => {
		const { parent } = this.props;
		parent.SetState({ hoverPanel: hovered ? 'definitions' : null, hoverTermID: hovered ? termID : null });
	};
	OnTermClick = (termID: string) => {
		const { map, path } = this.props;
		// parent.SetState({hoverPanel: "definitions", hoverTermID: termID});
		runInAction('TitlePanel_OnTermClick', () => {
			let nodeView_final = GetNodeView(map._key, path);
			if (nodeView_final == null) {
				nodeView_final = GetNodeViewsAlongPath(map._key, path, true).Last();
			}
			nodeView_final.openPanel = 'definitions';
			nodeView_final.openTermID = termID;
		});
	};

	render() {
		// const { map, parent, node, nodeView, path, displayText, equationNumber, style, ...rest } = this.props;
		const { map, parent, node, path, style, ...rest } = this.props;
		let { newTitle, editing, applyingEdit } = this.state;
		// UseImperativeHandle(ref, () => ({ OnDoubleClick }));

		const nodeView = GetNodeView(map._key, path);
		const latex = node.current.equation && node.current.equation.latex;
		const isSubnode = IsNodeSubnode(node);

		const displayText = GetNodeDisplayText(node, path);
		const equationNumber = node.current.equation ? GetEquationStepNumber(path) : null;

		newTitle = newTitle != null ? newTitle : displayText;

		const noteText = (node.current.equation && node.current.equation.explanation) || node.current.note;

		const RenderNodeDisplayText = (text: string) => {
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
									p: (props) => <span>{props.children}</span>,
								},
							}}/>,
					);
					if (edgeWhiteSpaceMatch[2]) elements.push(<span key={elements.length}>{edgeWhiteSpaceMatch[2]}</span>);
				} else if (segment.patternMatched == 'term') {
					const refText = segment.textParts[1];
					const termID = segment.textParts[2];
					elements.push(
						<TermPlaceholder key={elements.length} refText={refText} termID={termID}
							onHover={(hovered) => this.OnTermHover(termID, hovered)} onClick={() => this.OnTermClick(termID)}/>,
					);
				} else {
					Assert(false);
				}
			}
			return elements;
		};

		return (
			// <Row style={{position: "relative"}}>
			<div {...FilterOutUnrecognizedProps(rest, 'div')} style={E({ position: 'relative', cursor: 'pointer', fontSize: GetFontSizeForNode(node, isSubnode) }, style)} onClick={(e) => IsDoubleClick(e) && this.OnDoubleClick()}>
				{equationNumber != null &&
					<Pre>{equationNumber}) </Pre>}
				{!editing &&
					<span style={E(
						{ position: 'relative', whiteSpace: 'initial' },
						isSubnode && { margin: '4px 0 1px 0' },
						missingTitleStrings.Contains(newTitle) && { color: 'rgba(255,255,255,.3)' },
					)}>
						{latex && <NodeMathUI text={node.current.equation.text} onTermHover={this.OnTermHover} onTermClick={this.OnTermClick}/>}
						{!latex && RenderNodeDisplayText(newTitle)}
					</span>}
				{editing &&
					<Row style={E(
						{ position: 'relative', whiteSpace: 'initial', alignItems: 'stretch' },
						isSubnode && { margin: '4px 0 1px 0' },
					)}>
						{!applyingEdit &&
							<TextArea required={true} pattern={MapNodeRevision_titlePattern} allowLineBreaks={false} autoSize={true} style={ES({ flex: 1 })}
								ref={(a) => a && a.DOM_HTML.focus()}
								onKeyDown={(e) => {
									if (e.keyCode == keycode.codes.esc) {
										this.SetState({ editing: false });
									} else if (e.keyCode == keycode.codes.enter) {
										this.ApplyEdit();
									}
								}}
								value={newTitle} onChange={(val) => this.SetState({ newTitle: val })}/>}
						{!applyingEdit &&
							<Button enabled={newTitle.match(MapNodeRevision_titlePattern) != null} text="✔️" p="0 3px" style={{ borderRadius: '0 5px 5px 0' }}
								onClick={() => this.ApplyEdit()}/>}
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
	}

	async ApplyEdit() {
		const { map, node, path, newTitle } = this.PropsStateStash;

		this.SetState({ applyingEdit: true });

		const parentNode = GetParentNode(path);

		const form = GetNodeForm(node, path);
		const titleKey = { [ClaimForm.Negation]: 'negation', [ClaimForm.YesNoQuestion]: 'yesNoQuestion' }[form] || 'base';
		const newRevision = Clone(node.current);
		if (newRevision.titles[titleKey] != newTitle) {
			newRevision.titles[titleKey] = newTitle;

			const command = new AddNodeRevision({ mapID: map._key, revision: newRevision });
			const revisionID = await command.Run();
			runInAction('TitlePanel.ApplyEdit', () => store.main.maps.nodeLastAcknowledgementTimes.set(node._key, Date.now()));
			// await WaitTillPathDataIsReceiving(DBPath(`nodeRevisions/${revisionID}`));
			// await WaitTillPathDataIsReceived(DBPath(`nodeRevisions/${revisionID}`));
			// await command.WaitTillDBUpdatesReceived();
		}
		if (this.mounted) {
			this.SetState({ applyingEdit: false, editing: false });
		}
	}
}
