import { Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Pre, RowLR, Spinner } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { Connect, State, ACTSet } from 'Utils/FrameworkOverrides';
import { GADDemo } from 'UI/@GAD/GAD';
import { Button_GAD } from 'UI/@GAD/GADButton';
import { ACTSetInitialChildLimit } from '../../../../../Store/main';

export class LayoutDropDown extends BaseComponentPlus({} as {}, {}) {
	render() {
		const initialChildLimit = State.Watch(a => a.main.initialChildLimit);
		const showReasonScoreValues = State.Watch(a => a.main.showReasonScoreValues);

		const Button_Final = GADDemo ? Button_GAD : Button;
		const splitAt = 230;
		return (
			<DropDown>
				<DropDownTrigger><Button_Final text="Layout"/></DropDownTrigger>
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
