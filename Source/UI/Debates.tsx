import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { Button } from 'react-vcomponents';
import { Row } from 'react-vcomponents';
import { Column } from 'react-vcomponents';
import { GetMaps } from 'Store/firebase/maps';
import { GetUserPermissionGroups, MeID } from 'Store/firebase/users';
import { ScrollView } from 'react-vscrollview';
import { CanGetBasicPermissions } from 'Store/firebase/userExtras';
import { Connect, PageContainer } from 'Utils/FrameworkOverrides';
import { ToNumber } from 'js-vextensions';
import { styles, ES } from '../Utils/UI/GlobalStyles';
import { MapType, Map } from '../Store/firebase/maps/@Map';
import { MapEntryUI } from './@Shared/Maps/MapEntryUI';
import { PermissionGroupSet } from '../Store/firebase/userExtras/@UserExtraInfo';
import { ShowSignInPopup } from './@Shared/NavBar/UserPanel';
import { ShowAddMapDialog } from './@Shared/Maps/AddMapDialog';
import { GetSelectedDebateMapID, GetSelectedDebateMap } from '../Store/main/debates';
import { MapUI } from './@Shared/Maps/MapUI';

export const columnWidths = [0.64, 0.06, 0.12, 0.18];

const connector = (state, {}: {}) => ({
	permissions: GetUserPermissionGroups(MeID()),
	maps: GetMaps().filter(a => a && a.type == MapType.Debate),
	selectedMap: GetSelectedDebateMap(),
});
@Connect(connector)
export class DebatesUI extends BaseComponentWithConnector(connector, {}) {
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
						{/* <Row width={200} style={{position: "absolute", left: "calc(50% - 100px)"}}>
							<Button text={<Icon icon="arrow-left" size={15}/>} title="Previous page"
								enabled={page > 0} onClick={()=> {
									//store.dispatch(new ACTMapNodeListPageSet({mapID: map._id, page: page - 1}));
									store.dispatch(new ACTMapNodeListPageSet({mapID: map._id, page: page - 1}));
								}}/>
							<Div ml={10} mr={7}>Page: </Div>
							<TextInput mr={10} pattern="[0-9]+" style={{width: 30}} value={page + 1}
								onChange={val=> {
									if (!IsNumberString(val)) return;
									store.dispatch(new ACTMapNodeListPageSet({mapID: map._id, page: (parseInt(val) - 1).KeepBetween(0, lastPage)}))
								}}/>
							<Button text={<Icon icon="arrow-right" size={15}/>} title="Next page"
								enabled={page < lastPage} onClick={()=> {
									store.dispatch(new ACTMapNodeListPageSet({mapID: map._id, page: page + 1}));
								}}/>
						</Row>
						<Div mlr="auto"/>
						<Pre>Filter:</Pre>
						<InfoButton text="Hides nodes without the given text. Regular expressions can be used, ex: /there are [0-9]+ dimensions/"/>
						<TextInput ml={2} value={filter} onChange={val=>store.dispatch(new ACTMapNodeListFilterSet({mapID: map._id, filter: val}))}/> */}
						<Button text="Add debate" ml="auto" enabled={CanGetBasicPermissions(MeID())} onClick={() => {
							if (userID == null) return ShowSignInPopup();
							ShowAddMapDialog(userID, MapType.Debate);
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
			</PageContainer>
		);
	}
}
