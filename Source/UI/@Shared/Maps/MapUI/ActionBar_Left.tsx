import { Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Row } from 'react-vcomponents';
import { BaseComponent, GetInnerComp, BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { ScrollView } from 'react-vscrollview';
import { Layer } from 'Store/firebase/layers/@Layer';
import { GetChildCount } from 'Store/firebase/nodes';
import { GetNodeL2 } from 'Store/firebase/nodes/$node';
import { GetUser, MeID } from 'Store/firebase/users';
import { User } from 'Store/firebase/users/@User';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { GetUpdates, HSLA, Observer } from 'vwebapp-framework';
import { GADDemo } from 'UI/@GAD/GAD';
import { Button_GAD } from 'UI/@GAD/GADButton';
import { GetTimelinePanelOpen } from 'Store/main/maps/$map';
import { store } from 'Store';
import { GetAsync } from 'mobx-firelink';
import { runInAction } from 'mobx';
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
import { ShowAddLayerDialog } from '../Layers/AddLayerDialog';
import { MapDetailsUI } from '../MapDetailsUI';

@Observer
export class ActionBar_Left extends BaseComponentPlus({} as {map: Map, subNavBarWidth: number}, {}) {
	render() {
		const { map, subNavBarWidth } = this.props;
		const userID = MeID();
		IsUserCreatorOrMod(userID, map);
		const timelinePanelOpen = GetTimelinePanelOpen(map._key);

		return (
			<nav style={{
				position: 'absolute', zIndex: 1, left: 0, width: `calc(50% - ${subNavBarWidth / 2}px)`, top: 0, textAlign: 'center',
				// background: "rgba(0,0,0,.5)", boxShadow: "3px 3px 7px rgba(0,0,0,.07)",
			}}>
				<Row center style={E(
					{
						justifyContent: 'flex-start', background: 'rgba(0,0,0,.7)', boxShadow: colors.navBarBoxShadow,
						width: '100%', height: 30, borderRadius: '0 0 10px 0',
					},
					GADDemo && {
						background: HSLA(0, 0, 1, 1),
						boxShadow: 'rgba(100, 100, 100, .3) 0px 0px 3px, rgba(70,70,70,.5) 0px 0px 150px',
						// boxShadow: null,
						// filter: 'drop-shadow(rgba(0,0,0,.5) 0px 0px 10px)',
					},
				)}>
					{IsUserMap(map) &&
						<Button text="Back" style={{ height: '100%' }} onClick={() => {
							runInAction('ActionBar_Left.Back.onClick', () => {
								store.main[map.type == MapType.Private ? 'private' : 'public'].selectedMapID = null;
							});
						}}/>}
					{IsUserMap(map) && <DetailsDropDown map={map}/>}
					{/* IsUserMap(map) && <PeopleDropDown map={map}/> */}
					{/* // disabled for now, so we can iterate quickly on the stuff we're actually using right now
					{IsUserMap(map) && HasModPermissions(MeID()) && <LayersDropDown map={map}/>} */}
					{/* IsUserMap(map) && HasModPermissions(MeID()) && <TimelineDropDown map={map}/> */}
					{IsUserMap(map) && !GADDemo &&
						<Button ml={5} text="Timelines" style={{ height: '100%' }} onClick={() => {
							runInAction('ActionBar_Left.Timelines.onClick', () => {
								store.main.maps.get(map._key).timelinePanelOpen = !timelinePanelOpen;
							});
						}}/>}
				</Row>
			</nav>
		);
	}
}

export class DetailsDropDown extends BaseComponent<{map: Map}, {dataError: string}> {
	detailsUI: MapDetailsUI;
	render() {
		const { map } = this.props;
		const { dataError } = this.state;

		const Button_Final = GADDemo ? Button_GAD : Button;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		return (
			<DropDown>
				<DropDownTrigger><Button_Final ml={5} style={{ height: '100%' }} text="Details"/></DropDownTrigger>
				<DropDownContent style={{ left: 0 }}><Column>
					<MapDetailsUI ref={(c) => this.detailsUI = c} baseData={map}
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
										return void ShowMessageBox({
											title: 'Still has children',
											message: 'Cannot delete this map until all the children of its root-node have been unlinked or deleted.',
										});
									}

									ShowMessageBox({
										title: `Delete "${map.name}"`, cancelButton: true,
										message: `Delete the map "${map.name}"?`,
										onOK: async () => {
											await new DeleteMap({ mapID: map._key }).Run();
											store.main.public.selectedMapID = null;
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

/* export class PeopleDropDown extends BaseComponent<{map: Map}, {}> {
	render() {
		const { map } = this.props;

		const Button_Final = GADDemo ? Button_GAD : Button;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		return (
			<DropDown>
				<DropDownTrigger><Button_Final ml={5} style={{ height: '100%' }} text="People"/></DropDownTrigger>
				<DropDownContent style={{ left: 0 }}><Column>
				</Column></DropDownContent>
			</DropDown>
		);
	}
} */

export const columnWidths = [0.5, 0.3, 0.1, 0.1];

type LayersDropDownProps = {map: Map};
class LayersDropDown extends BaseComponentPlus({} as LayersDropDownProps, {}) {
	render() {
		const { map } = this.props;
		const userID = MeID();
		const layers = GetLayers();
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

class LayerUI extends BaseComponentPlus({} as {index: number, last: boolean, map: Map, layer: Layer}, {}) {
	render() {
		const { index, last, map, layer } = this.props;
		const userID = MeID();
		// const creator = GetUser({if: layer}, layer.creator); // todo
		const creator = GetUser(layer ? layer.creator : null);
		const userLayerState = GetUserLayerStateForMap(userID, map._key, layer._key);
		const creatorOrMod = IsUserCreatorOrMod(userID, map);
		const deleteLayerError = ForDeleteLayer_GetError(userID, layer);
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
