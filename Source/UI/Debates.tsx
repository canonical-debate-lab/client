import { ToNumber } from 'js-vextensions';
import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { GetMaps, GetMaps_Debate } from 'Store/firebase/maps';
import { CanGetBasicPermissions } from 'Store/firebase/userExtras';
import { GetUserPermissionGroups, MeID } from 'Store/firebase/users';
import { HSLA, PageContainer } from 'Utils/FrameworkOverrides';
import {GetSelectedDebateMap} from 'Store/main/debates';
import { MapType } from '../Store/firebase/maps/@Map';
import { ES } from '../Utils/UI/GlobalStyles';
import { GADDemo } from './@GAD/GAD';
import { ShowAddMapDialog } from './@Shared/Maps/AddMapDialog';
import { MapEntryUI } from './@Shared/Maps/MapEntryUI';
import { MapUI } from './@Shared/Maps/MapUI';
import { ShowSignInPopup } from './@Shared/NavBar/UserPanel';

export const columnWidths = [0.64, 0.06, 0.12, 0.18];

export class DebatesUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const userID = MeID();
		const permissions = GetUserPermissionGroups(userID);
		const maps = GetMaps_Debate(true);
		// maps = maps.OrderByDescending(a => ToNumber(a.edits, 0));
		const selectedMap = GetSelectedDebateMap();

		if (selectedMap) {
			return (
				<PageContainer fullWidth={true} fullHeight={true} style={{ margin: 0, padding: 0, background: null, filter: null }}>
					<MapUI map={selectedMap}/>
				</PageContainer>
			);
		}


		return (
			<PageContainer style={E({ margin: '20px auto 20px auto', padding: 0, background: null }, GADDemo && { filter: 'drop-shadow(rgba(0,0,0,.5) 0px 0px 10px)' })}>
				<Column className="clickThrough" style={E(
					{ height: 80, background: 'rgba(0,0,0,.7)', borderRadius: '10px 10px 0 0' },
					GADDemo && {
						background: 'rgba(222,222,222,1)', color: HSLA(221, 0.13, 0.42, 1),
						fontFamily: "'Cinzel', serif", fontVariant: 'small-caps', fontSize: 17, fontWeight: 'bold',
					},
				)}>
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
						<Button text="Add debate" ml="auto" enabled={CanGetBasicPermissions(MeID())} style={E(GADDemo && { color: 'rgb(255, 255, 255)' })} onClick={() => {
							if (userID == null) return ShowSignInPopup();
							ShowAddMapDialog(userID, MapType.Debate);
						}}/>
					</Row>
					<Row style={E(
						{ height: 40, padding: 10, fontWeight: 500, fontSize: 17 },
						GADDemo && { fontWeight: 'bold' },
					)}>
						<span style={{ flex: columnWidths[0] }}>Title</span>
						{!GADDemo && <span style={{ flex: columnWidths[1] }}>Edits</span>}
						<span style={{ flex: columnWidths[2] }}>Last edit</span>
						<span style={{ flex: columnWidths[3] }}>Creator</span>
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
