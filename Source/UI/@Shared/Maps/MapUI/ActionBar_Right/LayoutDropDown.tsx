import { Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Pre, Row, RowLR, Spinner } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { Map } from 'Store/firebase/maps/@Map';
import { GADDemo } from 'UI/@GAD/GAD';
import { Button_GAD } from 'UI/@GAD/GADButton';
import { ACTSet, State } from 'Utils/FrameworkOverrides';
import { ACTClearMapView } from 'Store/main/mapViews/$mapView';
import { ACTSetInitialChildLimit } from '../../../../../Store/main';

export class LayoutDropDown extends BaseComponentPlus({} as {map: Map}, {}) {
	render() {
		const { map } = this.props;
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
					<Row mt={5}>
						<Button text="Clear map-view state" onClick={() => {
							store.dispatch(new ACTClearMapView({ mapID: map._key }));
						}}/>
					</Row>
				</Column></DropDownContent>
			</DropDown>
		);
	}
}
