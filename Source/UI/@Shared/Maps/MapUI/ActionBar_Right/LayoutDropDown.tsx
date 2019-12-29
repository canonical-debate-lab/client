import { Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Pre, Row, RowLR, Spinner } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { Map } from 'Store/firebase/maps/@Map';
import { GADDemo } from 'UI/@GAD/GAD';
import { Button_GAD } from 'UI/@GAD/GADButton';
import { store } from 'Store';
import { runInAction } from 'mobx';
import { Observer } from 'vwebapp-framework';
import { ACTEnsureMapStateInit } from 'Store/main/maps';

@Observer
export class LayoutDropDown extends BaseComponentPlus({} as {map: Map}, {}) {
	render() {
		const { map } = this.props;
		const initialChildLimit = store.main.maps.initialChildLimit;
		const showReasonScoreValues = store.main.maps.showReasonScoreValues;

		const Button_Final = GADDemo ? Button_GAD : Button;
		const splitAt = 230;
		return (
			<DropDown>
				<DropDownTrigger><Button_Final text="Layout" style={{ height: '100%' }}/></DropDownTrigger>
				<DropDownContent style={{ right: 0, width: 320, borderRadius: '0 0 0 5px' }}><Column>
					<RowLR splitAt={splitAt}>
						<Pre>Initial child limit: </Pre>
						<Spinner min={1} style={{ width: '100%' }} value={initialChildLimit} onChange={(val) => {
							runInAction('LayoutDropDown.initialChildLimit.onChange', () => store.main.maps.initialChildLimit = val);
						}}/>
					</RowLR>
					<RowLR splitAt={splitAt}>
						<Pre>Show Reason Score values: </Pre>
						<CheckBox checked={showReasonScoreValues} onChange={(val) => {
							runInAction('LayoutDropDown.showReasonScoreValues.onChange', () => store.main.maps.showReasonScoreValues = val);
						}}/>
					</RowLR>
					<Row mt={5}>
						<Button text="Clear map-view state" onClick={() => {
							runInAction('LayoutDropDown.clearMapViewState.onClick', () => {
								store.main.maps.mapViews.delete(map._key);
								ACTEnsureMapStateInit(map._key);
							});
						}}/>
					</Row>
				</Column></DropDownContent>
			</DropDown>
		);
	}
}
