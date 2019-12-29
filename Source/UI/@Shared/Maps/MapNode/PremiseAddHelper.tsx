import keycode from 'keycode';
import { Button, Row, TextArea } from 'react-vcomponents';
import { BaseComponent, BaseComponentPlus } from 'react-vextensions';
import { store } from 'Store';
import { ACTMapNodeExpandedSet } from 'Store/main/maps/mapViews/$mapView';
import { runInAction } from 'mobx';
import { OmitIfFalsy } from 'js-vextensions';
import { AddChildNode } from '../../../../Server/Commands/AddChildNode';
import { ChildEntry, ClaimForm, MapNode, MapNodeL3 } from '../../../../Store/firebase/nodes/@MapNode';
import { MapNodeRevision, MapNodeRevision_titlePattern } from '../../../../Store/firebase/nodes/@MapNodeRevision';
import { MapNodeType } from '../../../../Store/firebase/nodes/@MapNodeType';

/* export class PremiseAddHelper extends BaseComponentPlus({} as {mapID: string, parentNode: MapNodeL3, parentPath: string}, { premiseTitle: '', adding: false }) {
	render() {
		const { mapID, parentNode, parentPath } = this.props;
		const { premiseTitle, adding } = this.state;

		if (adding) return <Row>Adding premise...</Row>;

		return (
			<Row style={{ alignItems: 'stretch', padding: '5px 0px' }}>
				{/* <TextInput placeholder="Type the argument's first claim/premise here." style={ES({flex: 1})}
					value={premiseTitle} onChange={val=>this.SetState({premiseTitle: val})}/> *#/}
				<TextArea className="noValidationColoring" required={true} pattern={MapNodeRevision_titlePattern} allowLineBreaks={false} autoSize={true} style={{ width: '100%' }}
					placeholder="Type the argument's first claim/premise here."
					onKeyDown={async (e) => {
						if (e.keyCode == keycode.codes.enter) {
							this.CreatePremise();
						}
					}}
					value={premiseTitle} onChange={(val) => this.SetState({ premiseTitle: val })}/>
				<Button enabled={premiseTitle.match(MapNodeRevision_titlePattern) != null} text="✔️" p="0 3px" style={{ borderRadius: '0 5px 5px 0' }}
					onClick={() => this.CreatePremise()}/>
			</Row>
		);
	}
	/* GetValidationError() {
		return GetErrorMessagesUnderElement(this.DOM)[0];
	} *#/

	async CreatePremise() {
		const { mapID, parentNode, parentPath } = this.props;
		const { premiseTitle } = this.state;

		this.SetState({ adding: true });

		const newNode = new MapNode({ type: MapNodeType.Claim, ownerMapID: OmitIfFalsy(parentNode.ownerMapID) });
		const newRevision = new MapNodeRevision({ titles: { base: premiseTitle } });
		const newLink = { _: true, form: ClaimForm.Base } as ChildEntry;

		const info = await new AddChildNode({ mapID, parentID: parentNode._key, node: newNode, revision: newRevision, link: newLink }).Run();
		ACTMapNodeExpandedSet({ mapID, path: `${parentPath}/${info.nodeID}`, expanded: true, resetSubtree: false });
		runInAction('PremiseAddHelper.CreatePremise', () => store.main.nodeLastAcknowledgementTimes.set(info.nodeID, Date.now()));

		// await WaitTillPathDataIsReceiving(`nodeRevisions/${info.revisionID}`);
		// await WaitTillPathDataIsReceived(`nodeRevisions/${info.revisionID}`);
	}
} */
