import { Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Row } from 'react-vcomponents';
import { BaseComponent, GetInnerComp, BaseComponentWithConnector } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { ScrollView } from 'react-vscrollview';
import { Layer } from 'Store/firebase/layers/@Layer';
import { GetChildCount } from 'Store/firebase/nodes';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { GetUser, MeID } from 'Store/firebase/users';
import { User } from 'Store/firebase/users/@User';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { GetUpdates, GetAsync, Connect, State } from 'Utils/FrameworkOverrides';
import { GetTimelinePanelOpen, ACTMap_TimelinePanelOpenSet } from 'Store/main/maps/$map';
import { colors, ES } from '../../../../Utils/UI/GlobalStyles';
import { DeleteLayer } from '../../../../Server/Commands/DeleteLayer';
import { DeleteMap } from '../../../../Server/Commands/DeleteMap';
import { SetLayerAttachedToMap } from '../../../../Server/Commands/SetLayerAttachedToMap';
import { SetMapLayerStateForUser } from '../../../../Server/Commands/SetMapLayerStateForUser';
import { UpdateMapDetails } from '../../../../Server/Commands/UpdateMapDetails';
import { ForDeleteLayer_GetError, GetLayers, GetMapLayerIDs } from '../../../../Store/firebase/layers';
import { IsUserMap } from '../../../../Store/firebase/maps';
import { Map, MapType } from '../../../../Store/firebase/maps/@Map';
import { HasModPermissions, IsUserCreatorOrMod } from '../../../../Store/firebase/userExtras';
import { GetUserLayerStateForMap } from '../../../../Store/firebase/userMapInfo';
import { ACTDebateMapSelect } from '../../../../Store/main/debates';
import { ACTPersonalMapSelect } from '../../../../Store/main/personal';
import { ShowAddLayerDialog } from '../Layers/AddLayerDialog';
import { MapDetailsUI } from '../MapDetailsUI';

const connector = (state, { map }: {map: Map, subNavBarWidth: number}) => ({
	_: IsUserCreatorOrMod(MeID(), map),
	timelinePanelOpen: GetTimelinePanelOpen(map._key),
});
@Connect(connector)
export class ActionBar_Left extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { map, subNavBarWidth, timelinePanelOpen } = this.props;
		return (
			<nav style={{
				position: 'absolute', zIndex: 1, left: 0, width: `calc(50% - ${subNavBarWidth / 2}px)`, top: 0, textAlign: 'center',
				// background: "rgba(0,0,0,.5)", boxShadow: "3px 3px 7px rgba(0,0,0,.07)",
			}}>
				<Row style={{
					justifyContent: 'flex-start', background: 'rgba(0,0,0,.7)', boxShadow: colors.navBarBoxShadow,
					width: '100%', height: 30, borderRadius: '0 0 10px 0',
				}}>
					{IsUserMap(map) &&
						<Button text="Back" onClick={() => {
							store.dispatch(new (map.type == MapType.Personal ? ACTPersonalMapSelect : ACTDebateMapSelect)({ id: null }));
						}}/>}
					{IsUserMap(map) && <DetailsDropDown map={map}/>}
					{/* // disabled for now, so we can iterate quickly on the stuff we're actually using right now
					{IsUserMap(map) && HasModPermissions(MeID()) && <LayersDropDown map={map}/>} */}
					{/* IsUserMap(map) && HasModPermissions(MeID()) && <TimelineDropDown map={map}/> */}
					{IsUserMap(map) &&
						<Button ml={5} text="Timelines" onClick={() => {
							store.dispatch(new ACTMap_TimelinePanelOpenSet({ mapID: map._key, open: !timelinePanelOpen }));
						}}/>}
				</Row>
			</nav>
		);
	}
}

class DetailsDropDown extends BaseComponent<{map: Map}, {dataError: string}> {
	detailsUI: MapDetailsUI;
	render() {
		const { map } = this.props;
		const { dataError } = this.state;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		return (
			<DropDown>
				<DropDownTrigger><Button ml={5} text="Details"/></DropDownTrigger>
				<DropDownContent style={{ left: 0 }}><Column>
					<MapDetailsUI ref={c => this.detailsUI = c} baseData={map}
						forNew={false} enabled={creatorOrMod}
						onChange={(newData) => {
							this.SetState({ dataError: this.detailsUI.GetValidationError() });
						}}/>
					{creatorOrMod &&
						<Row>
							<Button mt={5} text="Save" enabled={dataError == null} onLeftClick={async () => {
								const mapUpdates = GetUpdates(map, this.detailsUI.GetNewData()).Excluding('layers', 'timelines');
								await new UpdateMapDetails({ mapID: map._key, mapUpdates }).Run();
							}}/>
						</Row>}
					{creatorOrMod &&
						<Column mt={10}>
							<Row style={{ fontWeight: 'bold' }}>Advanced:</Row>
							<Row>
								<Button mt={5} text="Delete" onLeftClick={async () => {
									const rootNode = await GetAsync(() => GetNodeL2(map.rootNode));
									if (GetChildCount(rootNode) != 0) {
										return void ShowMessageBox({ title: 'Still has children',
											message: 'Cannot delete this map until all the children of its root-node have been unlinked or deleted.' });
									}

									ShowMessageBox({
										title: `Delete "${map.name}"`, cancelButton: true,
										message: `Delete the map "${map.name}"?`,
										onOK: async () => {
											await new DeleteMap({ mapID: map._key }).Run();
											store.dispatch(new ACTDebateMapSelect({ id: null }));
										},
									});
								}}/>
							</Row>
						</Column>}
				</Column></DropDownContent>
			</DropDown>
		);
	}
}

export const columnWidths = [0.5, 0.3, 0.1, 0.1];

type LayersDropDownProps = {map: Map} & Partial<{layers: Layer[]}>;
@Connect((state, { map }: LayersDropDownProps) => ({
	// layers: GetLayersForMap(map),
	layers: GetLayers(),
}))
class LayersDropDown extends BaseComponent<LayersDropDownProps, {}> {
	render() {
		const { map, layers } = this.props;
		const userID = MeID();
		const creatorOrMod = IsUserCreatorOrMod(userID, map);
		return (
			<DropDown>
				<DropDownTrigger><Button ml={5} text="Layers"/></DropDownTrigger>
				<DropDownContent style={{ left: 0, padding: null, background: null, borderRadius: null }}>
					<Row style={{ alignItems: 'flex-start' }}>
						<Column style={{ width: 600 }}>
							<Column className="clickThrough" style={{ height: 80, background: 'rgba(0,0,0,.7)' /* borderRadius: "10px 10px 0 0" */, maxHeight: 320 }}>
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
									<Button ml="auto" text="Add layer" onClick={() => {
										if (userID == null) return ShowSignInPopup();
										ShowAddLayerDialog(userID);
									}}/>
								</Row>
								<Row style={{ position: 'relative', height: 40, padding: 10 }}>
									<span style={{ position: 'absolute', right: 27, top: 3, fontSize: 13 }}>Enabled for...</span>
									<span style={{ flex: columnWidths[0], fontWeight: 500, fontSize: 17 }}>Title</span>
									<span style={{ flex: columnWidths[1], fontWeight: 500, fontSize: 17 }}>Creator</span>
									<span style={{ flex: columnWidths[2], marginTop: 15, fontWeight: 500, fontSize: 15 }}>Map</span>
									<span style={{ flex: columnWidths[3], marginTop: 15, fontWeight: 500, fontSize: 15 }}>User</span>
								</Row>
							</Column>
							<ScrollView style={ES({ flex: 1 })} contentStyle={ES({ flex: 1, position: 'relative' })}>
								{layers.length == 0 && <div style={{ textAlign: 'center', fontSize: 18 }}>Loading...</div>}
								{layers.map((layer, index) => <LayerUI key={layer._key} index={index} last={index == layers.length - 1} map={map} layer={layer}/>)}
							</ScrollView>
						</Column>
						{false &&
							<Column style={{ width: 400 }}>
							</Column>}
					</Row>
				</DropDownContent>
			</DropDown>
		);
	}
}

type LayerUIProps = {index: number, last: boolean, map: Map, layer: Layer} & Partial<{creator: User, userLayerState: boolean}>;
@Connect((state, { map, layer }: LayerUIProps) => ({
	creator: layer && GetUser(layer.creator),
	userLayerState: GetUserLayerStateForMap(MeID(), map._key, layer._key),
}))
class LayerUI extends BaseComponent<LayerUIProps, {}> {
	render() {
		const { index, last, map, layer, creator, userLayerState } = this.props;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		const deleteLayerError = ForDeleteLayer_GetError(MeID(), layer);
		return (
			<Column p="7px 10px" style={E(
				{ background: index % 2 == 0 ? 'rgba(30,30,30,.7)' : 'rgba(0,0,0,.7)' },
				last && { borderRadius: '0 0 10px 10px' },
			)}>
				<Row>
					<span style={{ flex: columnWidths[0] }}>
						{layer.name}
						{creator && creator._key == MeID() &&
							<Button text="X" ml={5} style={{ padding: '3px 5px' }} enabled={deleteLayerError == null} title={deleteLayerError}
								onClick={() => {
									ShowMessageBox({
										title: `Delete "${layer.name}"`, cancelButton: true,
										message: `Delete the layer "${layer.name}"?`,
										onOK: async () => {
											new DeleteLayer({ layerID: layer._key }).Run();
										},
									});
								}}/>}
					</span>
					<span style={{ flex: columnWidths[1] }}>{creator ? creator.displayName : '...'}</span>
					<span style={{ flex: columnWidths[2] }}>
						<CheckBox enabled={creatorOrMod} checked={GetMapLayerIDs(map).Contains(layer._key)} onChange={(val) => {
							new SetLayerAttachedToMap({ mapID: map._key, layerID: layer._key, attached: val }).Run();
						}}/>
					</span>
					<span style={{ flex: columnWidths[3] }}>
						<CheckBox checked={userLayerState} indeterminate={userLayerState == null} onChange={(val) => {
							if (MeID() == null) return ShowSignInPopup();
							const newState =								userLayerState == null ? true
								: userLayerState == true ? false
									: null;
							new SetMapLayerStateForUser({ userID: MeID(), mapID: map._key, layerID: layer._key, state: newState }).Run();
						}}/>
					</span>
				</Row>
			</Column>
		);
	}
}
