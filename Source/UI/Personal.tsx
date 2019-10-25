import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, UseCallback } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { GetMaps } from 'Store/firebase/maps';
import { CanGetBasicPermissions } from 'Store/firebase/userExtras';
import { MeID, GetUserPermissionGroups } from 'Store/firebase/users';
import { GetSelectedPersonalMap } from 'Store/main/personal';
import { columnWidths } from 'UI/Debates';
import { Connect, PageContainer } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { ToNumber } from 'js-vextensions';
import { useMemo, useCallback } from 'react';
import { Map, MapType } from '../Store/firebase/maps/@Map';
import { PermissionGroupSet } from '../Store/firebase/userExtras/@UserExtraInfo';
import { ShowAddMapDialog } from './@Shared/Maps/AddMapDialog';
import { MapEntryUI } from './@Shared/Maps/MapEntryUI';
import { MapUI } from './@Shared/Maps/MapUI';
import { ShowSignInPopup } from './@Shared/NavBar/UserPanel';

type Props = {} & Partial<{permissions: PermissionGroupSet, maps: Map[], selectedMap: Map}>;

const connector = (state, {}: {}) => ({
	permissions: GetUserPermissionGroups(MeID()),
	maps: GetMaps().filter(a => a && a.type == MapType.Personal),
	selectedMap: GetSelectedPersonalMap(),
	userID: MeID(),
});
@Connect(connector)
export class PersonalUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		let { permissions, maps, selectedMap } = this.props;
		const userID = MeID();

		if (selectedMap) {
			return (
				<PageContainer fullWidth={true} fullHeight={true} style={{ margin: 0, padding: 0, background: null, filter: null }}>
					<MapUI map={selectedMap}/>
				</PageContainer>
			);
		}

		maps = maps.OrderByDescending(a => ToNumber(a.edits, 0));

		return (
			<PageContainer style={{ margin: '20px auto 20px auto', padding: 0, background: null }}>
				<Column className="clickThrough" style={{ height: 80, background: 'rgba(0,0,0,.7)', borderRadius: '10px 10px 0 0' }}>
					<Row style={{ height: 40, padding: 10 }}>
						<Button text="Add map" ml="auto" enabled={CanGetBasicPermissions(MeID())} onClick={UseCallback(() => {
							if (userID == null) return void ShowSignInPopup();
							ShowAddMapDialog(userID, MapType.Personal);
						}, [userID])}/>
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
			</PageContainer>
		);
	}
}
