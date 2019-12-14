import { CachedTransform } from 'js-vextensions';
import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponent, BaseComponentPlus } from 'react-vextensions';
import { GetCurrentURL, Link, Observer } from 'vwebapp-framework';
import { TermComponentsUI } from 'UI/Database/Terms/TermComponentsUI';
import { Fragment } from 'react';
import { ParseSegmentsForPatterns } from '../../../../../../Utils/General/RegexHelpers';
import { GetNodeDisplayText } from '../../../../../../Store/firebase/nodes/$node';
import { MapNode, MapNodeL2 } from '../../../../../../Store/firebase/nodes/@MapNode';
import { GetTerm, GetTermVariantNumber } from '../../../../../../Store/firebase/terms';
import { Term } from '../../../../../../Store/firebase/terms/@Term';

const termsPlaceholder = [];

@Observer
export class DefinitionsPanel extends BaseComponentPlus(
	{} as {node: MapNodeL2, path: string, hoverTermID?: string, openTermID?: string, onHoverTerm?: (termID: string)=>void, onClickTerm?: (termID: string)=>void},
	{/* localHoverTerm: Term, localClickTerm: Term */},
) {
	render() {
		const { node, path, hoverTermID, openTermID, onHoverTerm, onClickTerm } = this.props;

		const displayText = GetNodeDisplayText(node, path);
		// let segments = ParseSegmentsFromNodeDisplayText(displayText);
		const segments = ParseSegmentsForPatterns(displayText, [
			{ name: 'term', regex: /{(.+?)\}\[(.+?)\]/ },
		]);
		let terms = segments.filter((a) => a.patternMatched == 'term').map((a) => GetTerm(a.textParts[2]));
		// only pass terms when all are loaded
		terms = terms.every((a) => a != null) ? terms : termsPlaceholder;

		const terms_variantNumbers = terms.map((a) => (a ? GetTermVariantNumber(a) : 1));
		const hoverTerm = hoverTermID ? GetTerm(hoverTermID) : null;
		const clickTerm = openTermID ? GetTerm(openTermID) : null;

		// let {localHoverTerm, localClickTerm} = this.state;
		// let term = localClickTerm || localHoverTerm || clickTerm || hoverTerm;
		const term = hoverTerm || clickTerm;

		return (
			<Column style={{ position: 'relative' }}>
				{/* <div style={{fontSize: 12, whiteSpace: "initial"}}>
					Proponents of the claim can submit and upvote their definitions of the terms. (thus clarifying their meaning)
				</div> */}
				{/* <Div style={{fontSize: 12, color: "rgba(255, 255, 255, 0.5)"}}>Definitions panel is under development.</Div> */}
				{/* <Row>
					<Pre>Terms: </Pre>
					{terms.map((term, index)=> {
						return (
							<Button key={index} ml={index == 0 ? 0 : 5} text={<span>{term.name}<sup>{terms_variantNumbers[index]}</sup></span> as any}
							//<Button key={index} text={<span>{term.name}<sup>{term._id}</sup></span> as any}
								//onMouseEnter={e=>this.SetState({localHoverTerm: term})} onMouseLeave={e=>this.SetState({localHoverTerm: null})}
								onMouseEnter={e=>onHoverTerm(term._id)} onMouseLeave={e=>onHoverTerm(null)}
								onClick={e=> {
									//this.SetState({localClickTerm: term});
									onClickTerm(term._id);
								}}/>
						);
					})}
				</Row> */}
				{term && <TermDefinitionPanel term={term} termVariantNumber={terms_variantNumbers[terms.indexOf(term)]}/>}
				{!term && terms.length > 0 &&
					<div style={{ fontSize: 12, whiteSpace: 'initial' }}>Select a highlighted term above to see the definition for it here.</div>}
				{!term && terms.length == 0 &&
					<div style={{ fontSize: 12, whiteSpace: 'initial' }}>This node does not currently have any term definitions attached.</div>}
			</Column>
		);
	}
}

class TermDefinitionPanel extends BaseComponent<{term: Term, termVariantNumber: number}, {}> {
	render() {
		const { term, termVariantNumber } = this.props;

		// let creatorOrMod = term != null && IsUserCreatorOrMod(MeID(), term);
		const showDetailsURL = GetCurrentURL().Clone();
		showDetailsURL.pathNodes = ['database', 'terms', `${term._key}`];
		showDetailsURL.queryVars = [];

		return (
			<Column sel mt={5} style={{ whiteSpace: 'normal' }}>
				<Row>Term: {term.name}{term.disambiguation ? ` (${term.disambiguation})` : ''} (variant #{termVariantNumber}) (id: {term._key})</Row>
				<Row mt={5}>Short description: {term.shortDescription_current}</Row>
				{term.components && term.components.VKeys(true).length > 0 &&
					<Fragment>
						<Row mt={5}>Components:</Row>
						<TermComponentsUI term={term} editing={false} inMap={true} style={{ padding: '5px 0' }}/>
					</Fragment>}
				{/* <Row>Details:</Row>
				<TermDetailsUI baseData={term} creating={false} enabled={/*creatorOrMod*#/ false} style={{padding: 10}}
					onChange={data=>this.SetState({selectedTerm_newData: data})}/> */}
				<Link to={showDetailsURL.toString({ domain: false })} onContextMenu={(e) => e.nativeEvent['passThrough'] = true}>
					<Button mt={5} text="Show details" /* onClick={e=> {
						store.dispatch(push());
						//store.dispatch(new ACTTermSelect({id: term._id}));
					}} *//>
				</Link>
			</Column>
		);
	}
}
