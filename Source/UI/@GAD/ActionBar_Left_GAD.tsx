import { Connect, HSLA } from 'Utils/FrameworkOverrides';
import { BaseComponentWithConnector } from 'react-vextensions';
import { Row, Button } from 'react-vcomponents';
import { colors } from 'Utils/UI/GlobalStyles';
import { LayoutDropDown } from 'UI/@Shared/Maps/MapUI/ActionBar_Right/LayoutDropDown';
import { Map, MapType } from 'Store_Old/firebase/maps/@Map';
import { MeID } from 'Store_Old/firebase/users';
import { GetTimelinePanelOpen } from 'Store_Old/main/maps/$map';
import { IsUserMap } from 'Store_Old/firebase/maps';
import { ACTPersonalMapSelect } from 'Store_Old/main/personal';
import { ACTDebateMapSelect } from 'Store_Old/main/debates';
import { DetailsDropDown } from 'UI/@Shared/Maps/MapUI/ActionBar_Left';
import { IsUserCreatorOrMod } from 'Store_Old/firebase/userExtras';
import { Button_GAD } from './GADButton';

const connector = (state, { map }: {map: Map, subNavBarWidth: number}) => ({
	_: IsUserCreatorOrMod(MeID(), map),
	timelinePanelOpen: GetTimelinePanelOpen(map._key),
});
@Connect(connector)
export class ActionBar_Left_GAD extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { map, subNavBarWidth, timelinePanelOpen } = this.props;
		return (
			<nav style={{
				position: 'absolute', zIndex: 1, left: 0, width: `calc(50% - ${subNavBarWidth / 2}px)`, top: 0, textAlign: 'center',
				// background: "rgba(0,0,0,.5)", boxShadow: "3px 3px 7px rgba(0,0,0,.07)",
			}}>
				<Row center style={E(
					{
						justifyContent: 'flex-start', background: 'rgba(0,0,0,.7)', boxShadow: colors.navBarBoxShadow,
						width: '100%', height: 40, borderRadius: '0 0 10px 0',
					},
					{
						background: HSLA(0, 0, 1, 1),
						boxShadow: 'rgba(100, 100, 100, .3) 0px 0px 3px, rgba(70,70,70,.5) 0px 0px 150px',
						// boxShadow: null,
						// filter: 'drop-shadow(rgba(0,0,0,.5) 0px 0px 10px)',
					},
				)}>
					{IsUserMap(map) &&
						<Button_GAD text="Back" onClick={() => {
							store.dispatch(new (map.type == MapType.Personal ? ACTPersonalMapSelect : ACTDebateMapSelect)({ id: null }));
						}}/>}
					{IsUserMap(map) && <DetailsDropDown map={map}/>}
				</Row>
			</nav>
		);
	}
}
