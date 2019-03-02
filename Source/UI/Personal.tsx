import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { GetMaps } from 'Store/firebase/maps';
import { CanGetBasicPermissions } from 'Store/firebase/userExtras';
import { GetUserID, GetUserPermissionGroups } from 'Store/firebase/users';
import { GetSelectedPersonalMap } from 'Store/main/personal';
import { columnWidths } from 'UI/Debates';
import {Connect} from 'Utils/FrameworkOverrides';
import {Map, MapType} from '../Store/firebase/maps/@Map';
import {PermissionGroupSet} from '../Store/firebase/userExtras/@UserExtraInfo';
import {ShowAddMapDialog} from './@Shared/Maps/AddMapDialog';
import {MapEntryUI} from './@Shared/Maps/MapEntryUI';
import {MapUI} from './@Shared/Maps/MapUI';
import {ShowSignInPopup} from './@Shared/NavBar/UserPanel';

type Props = {} & Partial<{permissions: PermissionGroupSet, maps: Map[], selectedMap: Map}>;

const connector = (state, {}: {}) => ({
	permissions: GetUserPermissionGroups(GetUserID()),
	maps: GetMaps().filter(a => a && a.type == MapType.Personal),
	selectedMap: GetSelectedPersonalMap(),
});
@Connect(connector)
export class PersonalUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		let { permissions, maps, selectedMap } = this.props;
		const userID = GetUserID();

		if (selectedMap) {
			return <MapUI map={selectedMap}/>;
		}

		maps = maps.OrderByDescending(a => a.edits);

		return (
			<Column style={ES({ width: 960, flex: 1, margin: '20px auto 20px auto', filter: 'drop-shadow(rgb(0, 0, 0) 0px 0px 10px)' })}>
				<Column className="clickThrough" style={{ height: 80, background: 'rgba(0,0,0,.7)', borderRadius: '10px 10px 0 0' }}>
					<Row style={{ height: 40, padding: 10 }}>
						<Button text="Add map" ml="auto" enabled={CanGetBasicPermissions('me')} onClick={() => {
							if (userID == null) return ShowSignInPopup();
							ShowAddMapDialog(userID, MapType.Personal);
						}}/>
					</Row>
					<Row style={{ height: 40, padding: 10 }}>
						<span style={{ flex: columnWidths[0], fontWeight: 500, fontSize: 17 }}>Title</span>
						<span style={{ flex: columnWidths[1], fontWeight: 500, fontSize: 17 }}>Edits</span>
						<span style={{ flex: columnWidths[2], fontWeight: 500, fontSize: 17 }}>Last edit</span>
						<span style={{ flex: columnWidths[3], fontWeight: 500, fontSize: 17 }}>Creator</span>
					</Row>
				</Column>
				<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1 })}>
					{maps.length == 0 && <div style={{ textAlign: 'center', fontSize: 18 }}>Loading...</div>}
					{maps.map((map, index) => <MapEntryUI key={index} index={index} last={index == maps.length - 1} map={map}/>)}
				</ScrollView>
			</Column>
		);
	}
}
