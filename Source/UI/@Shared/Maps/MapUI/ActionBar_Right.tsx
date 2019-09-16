import { Pre, Row, Select } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { ShowChangesSinceType } from 'Store/main/maps/@MapInfo';
import { ShareDropDown } from 'UI/@Shared/Maps/MapUI/ActionBar_Right/ShareDropDown';
import { State, Connect, ActionSet, ACTSet } from 'Utils/FrameworkOverrides';
import { GetEntries, FromJSON } from 'js-vextensions';
import { colors } from '../../../../Utils/UI/GlobalStyles';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { WeightingType } from '../../../../Store/main';
import { LayoutDropDown } from './ActionBar_Right/LayoutDropDown';

const changesSince_options = [];
changesSince_options.push({ name: 'None', value: `${ShowChangesSinceType.None}_null` });
for (let offset = 1; offset <= 5; offset++) {
	const offsetStr = [null, '', '2nd ', '3rd ', '4th ', '5th '][offset];
	changesSince_options.push({ name: `Your ${offsetStr}last visit`, value: `${ShowChangesSinceType.SinceVisitX}_${offset}` });
}
changesSince_options.push({ name: 'All unclicked changes', value: `${ShowChangesSinceType.AllUnseenChanges}_null` });

const connector = (state, { map }: {map: Map, subNavBarWidth: number}) => ({
	showChangesSince_type: State(`main/maps/${map._key}/showChangesSince_type`) as ShowChangesSinceType,
	showChangesSince_visitOffset: State(`main/maps/${map._key}/showChangesSince_visitOffset`) as number,
	weighting: State(a => a.main.weighting),
});
@Connect(connector)
export class ActionBar_Right extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { map, subNavBarWidth, showChangesSince_type, showChangesSince_visitOffset, weighting } = this.props;
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
						<Select options={GetEntries(WeightingType, name => ({ ReasonScore: 'Reason score' })[name] || name)} value={weighting} onChange={(val) => {
							store.dispatch(new ACTSet(a => a.main.weighting, val));
						}}/>
					</Row>
					{/* <ShareDropDown map={map}/> // disabled for now, till we re-implement shareable map-views using json-based approach */}
					<LayoutDropDown/>
				</Row>
			</nav>
		);
	}
}
