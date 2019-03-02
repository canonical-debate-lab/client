import { Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Pre, RowLR, Spinner } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { Connect, State, ACTSet } from 'Utils/FrameworkOverrides';
import { ACTSetInitialChildLimit } from '../../../../../Store/main';

const connector = (state, {}: {}) => ({
	initialChildLimit: State(a => a.main.initialChildLimit),
	showReasonScoreValues: State(a => a.main.showReasonScoreValues),
});
@Connect(connector)
export class LayoutDropDown extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { initialChildLimit, showReasonScoreValues } = this.props;
		const splitAt = 230;
		return (
			<DropDown>
				<DropDownTrigger><Button text="Layout"/></DropDownTrigger>
				<DropDownContent style={{ right: 0, width: 320 }}><Column>
					<RowLR splitAt={splitAt}>
						<Pre>Initial child limit: </Pre>
						<Spinner min={1} style={{ width: '100%' }}
							value={initialChildLimit} onChange={val => store.dispatch(new ACTSetInitialChildLimit({ value: val }))}/>
					</RowLR>
					<RowLR splitAt={splitAt}>
						<Pre>Show Reason Score values: </Pre>
						<CheckBox checked={showReasonScoreValues} onChange={val => store.dispatch(new ACTSet(a => a.main.showReasonScoreValues, val))}/>
					</RowLR>
				</Column></DropDownContent>
			</DropDown>
		);
	}
}
