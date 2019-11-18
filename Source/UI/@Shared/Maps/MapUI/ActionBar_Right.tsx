import { Pre, Row, Select } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { ShowChangesSinceType } from 'Store_Old/main/maps/@MapInfo';
import { ShareDropDown } from 'UI/@Shared/Maps/MapUI/ActionBar_Right/ShareDropDown';
import { State, Connect, ActionSet, ACTSet, HSLA } from 'Utils/FrameworkOverrides';
import { GetEntries, FromJSON } from 'js-vextensions';
import { GADDemo } from 'UI/@GAD/GAD';
import { colors } from '../../../../Utils/UI/GlobalStyles';
import { Map } from '../../../../Store_Old/firebase/maps/@Map';
import { WeightingType } from '../../../../Store_Old/main';
import { LayoutDropDown } from './ActionBar_Right/LayoutDropDown';

const changesSince_options = [];
changesSince_options.push({ name: 'None', value: `${ShowChangesSinceType.None}_null` });
for (let offset = 1; offset <= 5; offset++) {
	const offsetStr = [null, '', '2nd ', '3rd ', '4th ', '5th '][offset];
	changesSince_options.push({ name: `Your ${offsetStr}last visit`, value: `${ShowChangesSinceType.SinceVisitX}_${offset}` });
}
changesSince_options.push({ name: 'All unclicked changes', value: `${ShowChangesSinceType.AllUnseenChanges}_null` });

export class ActionBar_Right extends BaseComponentPlus({} as {map: Map, subNavBarWidth: number}, {}) {
	render() {
		const { map, subNavBarWidth } = this.props;
		const showChangesSince_type = State.Watch(`main/maps/${map._key}/showChangesSince_type`) as ShowChangesSinceType;
		const showChangesSince_visitOffset = State.Watch(`main/maps/${map._key}/showChangesSince_visitOffset`) as number;
		const weighting = State.Watch((a) => a.main.weighting);

		const tabBarWidth = 104;
		return (
			<nav style={{
				position: 'absolute', zIndex: 1, left: `calc(50% + ${subNavBarWidth / 2}px)`, right: 0, top: 0, textAlign: 'center',
				// background: "rgba(0,0,0,.5)", boxShadow: "3px 3px 7px rgba(0,0,0,.07)",
			}}>
				<Row style={{
					justifyContent: 'flex-end', background: 'rgba(0,0,0,.7)', boxShadow: colors.navBarBoxShadow,
					width: '100%', height: 30, borderRadius: '0 0 0 10px',
				}}>
					<Row center mr={5}>
						<Pre>Show changes since: </Pre>
						<Select options={changesSince_options} value={`${showChangesSince_type}_${showChangesSince_visitOffset}`} onChange={(val) => {
							const parts = val.split('_');
							store.dispatch(new ActionSet(
								new ACTSet(`main/maps/${map._key}/showChangesSince_type`, parseInt(parts[0])),
								new ACTSet(`main/maps/${map._key}/showChangesSince_visitOffset`, FromJSON(parts[1])),
							));
						}}/>
						<Pre ml={5}>Weighting: </Pre>
						<Select options={GetEntries(WeightingType, (name) => ({ ReasonScore: 'Reason score' })[name] || name)} value={weighting} onChange={(val) => {
							store.dispatch(new ACTSet((a) => a.main.weighting, val));
						}}/>
					</Row>
					{/* <ShareDropDown map={map}/> // disabled for now, till we re-implement shareable map-views using json-based approach */}
					<LayoutDropDown map={map}/>
				</Row>
			</nav>
		);
	}
}
