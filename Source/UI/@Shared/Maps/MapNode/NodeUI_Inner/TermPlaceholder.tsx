import { BaseComponent } from 'react-vextensions';
import { Connect } from 'Utils/FrameworkOverrides';
import { GetTerm, GetTermVariantNumber } from '../../../../../Store/firebase/terms';
import { Term } from '../../../../../Store/firebase/terms/@Term';

@Connect((state, { termID }) => {
	const term = GetTerm(termID);
	return {
		term,
		termVariantNumber: term ? GetTermVariantNumber(term) : null,
	};
})
export class TermPlaceholder extends BaseComponent
		<{refText: string, termID: string, showVariantNumber?: boolean, onHover: (hovered: boolean)=>void, onClick: ()=>void}
			& Partial<{term: Term, termVariantNumber: number}>,
		{}> {
	static defaultProps = { showVariantNumber: true };
	render() {
		const { refText, termID, showVariantNumber, onHover, onClick, term, termVariantNumber } = this.props;
		// if (term == null) return <a>...</a>;
		// if (term == null) return <a>{refText}</a>;
		return (
			<a
				onMouseEnter={e => onHover(true)}
				onMouseLeave={e => onHover(false)}
				onClick={(e) => {
					/* if (this.definitionsPanel == null) return;
						GetInnerComp(this.definitionsPanel).SetState({termFromLocalClick: GetTerm(termID)}); */
					// this.SetState({clickTermID: termID});
					onClick();
				}}>
				{/* term.name */}
				{refText}
				{showVariantNumber &&
					<sup>{termVariantNumber || '?'}</sup>}
				{/* <sub>{termVariantNumber}</sub>} */}
			</a>
		);
	}
}
