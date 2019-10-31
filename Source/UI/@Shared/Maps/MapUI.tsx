import { StandardCompProps } from 'Utils/UI/General';
import { DeepGet, E, SleepAsync, Timer, Vector2i, FindDOMAll, Assert, FromJSON, ToJSON } from 'js-vextensions';
import { Column, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, FindReact, GetDOM, BaseComponentPlus } from 'react-vextensions';
import { VMenuStub } from 'react-vmenu';
import { VMenuItem } from 'react-vmenu/dist/VMenu';
import { ScrollView } from 'react-vscrollview';
import { TimelinePlayerUI } from 'UI/@Shared/Maps/MapUI/TimelinePlayerUI';
import { State, Connect, GetDistanceBetweenRectAndPoint, inFirefox, Watch } from 'Utils/FrameworkOverrides';
import { GetTimelinePanelOpen, GetPlayingTimelineRevealNodes_All, GetPlayingTimeline } from 'Store/main/maps/$map';
import { GADDemo } from 'UI/@GAD/GAD';
import { ActionBar_Left_GAD } from 'UI/@GAD/ActionBar_Left_GAD';
import { ActionBar_Right_GAD } from 'UI/@GAD/ActionBar_Right_GAD';
import { styles, ES } from '../../../Utils/UI/GlobalStyles';
import { Map } from '../../../Store/firebase/maps/@Map';
import { GetNodeL3, IsNodeL2, IsNodeL3 } from '../../../Store/firebase/nodes/$node';
import { MapNodeL3 } from '../../../Store/firebase/nodes/@MapNode';
import { RootState } from '../../../Store/index';
import { GetOpenMapID } from '../../../Store/main';
import { GetFocusedNodePath, GetMapView, GetNodeView, GetSelectedNodePath, GetViewOffset } from '../../../Store/main/mapViews';
import { ACTMapNodeSelect, ACTViewCenterChange } from '../../../Store/main/mapViews/$mapView/rootNodeViews';
import { NodeUI } from './MapNode/NodeUI';
import { NodeUI_ForBots } from './MapNode/NodeUI_ForBots';
import { NodeUI_Inner } from './MapNode/NodeUI_Inner';
import { ActionBar_Left } from './MapUI/ActionBar_Left';
import { ActionBar_Right } from './MapUI/ActionBar_Right';
import { TimelinePanel } from './MapUI/TimelinePanel';
import { TimelineIntroBox } from './MapUI/TimelineIntroBox';


export function GetNodeBoxForPath(path: string) {
	const nodeInnerBoxes = FindDOMAll('.NodeUI_Inner').map(a => DeepGet(FindReact(a), 'props/parent') as NodeUI_Inner);
	return nodeInnerBoxes.FirstOrX(a => a.props.path == path);
}
export function GetNodeBoxClosestToViewCenter() {
	const viewCenter_onScreen = new Vector2i(window.innerWidth / 2, window.innerHeight / 2);
	return FindDOMAll('.NodeUI_Inner').Min(nodeBox => GetDistanceBetweenRectAndPoint($(nodeBox).GetScreenRect(), viewCenter_onScreen));
}
export function GetViewOffsetForNodeBox(nodeBox: Element) {
	const viewCenter_onScreen = new Vector2i(window.innerWidth / 2, window.innerHeight / 2);
	return viewCenter_onScreen.Minus($(nodeBox).GetScreenRect().Position).NewX(x => x.RoundTo(1)).NewY(y => y.RoundTo(1));
}

export function UpdateFocusNodeAndViewOffset(mapID: string) {
	/* let selectedNodePath = GetSelectedNodePath(mapID);
	let focusNodeBox = selectedNodePath ? GetNodeBoxForPath(selectedNodePath) : GetNodeBoxClosestToViewCenter(); */
	const focusNodeBox = GetNodeBoxClosestToViewCenter();
	if (focusNodeBox == null) return; // can happen if node was just deleted

	const focusNodeBoxComp = FindReact(focusNodeBox).props.parent as NodeUI_Inner;
	const focusNodePath = focusNodeBoxComp.props.path;
	if (focusNodePath == null) return; // can happen sometimes; not sure what causes
	const viewOffset = GetViewOffsetForNodeBox(focusNodeBox);

	const oldNodeView = GetNodeView(mapID, focusNodePath);
	if (oldNodeView == null || !oldNodeView.focused || !viewOffset.Equals(oldNodeView.viewOffset)) {
		store.dispatch(new ACTViewCenterChange({ mapID, focusNodePath, viewOffset }));
	}
}

type Props = {
	map: Map, rootNode?: MapNodeL3, withinPage?: boolean,
	padding?: {left: number, right: number, top: number, bottom: number},
	subNavBarWidth?: number,
} & React.HTMLProps<HTMLDivElement>;
export class MapUI extends BaseComponentPlus({
	// padding: {left: 2000, right: 2000, top: 1000, bottom: 1000}
	padding: { left: screen.availWidth, right: screen.availWidth, top: screen.availHeight, bottom: screen.availHeight },
	subNavBarWidth: 0,
} as Props, {}) {
	private static currentMapUI: MapUI;
	static get CurrentMapUI() { return MapUI.currentMapUI && MapUI.currentMapUI.mounted ? MapUI.currentMapUI : null; }

	static ValidateProps(props) {
		const { rootNode } = props;
		if (rootNode) {
			Assert(IsNodeL2(rootNode), 'Node supplied to MapUI is not level-2!');
			Assert(IsNodeL3(rootNode), 'Node supplied to MapUI is not level-3!');
		}
	}

	scrollView: ScrollView;
	mapUI: HTMLDivElement;
	downPos: Vector2i;
	render() {
		const { map, rootNode: rootNode_passed, withinPage, padding, subNavBarWidth, ...rest } = this.props;
		const rootNode = Watch(() => {
			let result = rootNode_passed;
			if (result == null && map && map.rootNode) {
				result = GetNodeL3(`${map.rootNode}`);
			}
			if (map) {
				const nodeID = State('main', 'mapViews', map._key, 'bot_currentNodeID');
				if (isBot && nodeID) {
					result = GetNodeL3(`${nodeID}`);
				}
			}
			return result;
		}, [map, rootNode_passed]);
		const timelinePanelOpen = Watch(() => (map ? GetTimelinePanelOpen(map._key) : null), [map]);
		const playingTimeline = GetPlayingTimeline.Watch(map._key);

		if (map == null) {
			return <div style={ES({ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 25 })}>Loading map...</div>;
		}
		Assert(map._key, 'map._key is null!');
		if (rootNode == null) {
			return <div style={ES({ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 25 })}>Loading root node...</div>;
		}

		if (isBot) {
			return <NodeUI_ForBots map={map} node={rootNode}/>;
		}
		const ActionBar_Left_Final = GADDemo ? ActionBar_Left_GAD : ActionBar_Left;
		const ActionBar_Right_Final = GADDemo ? ActionBar_Right_GAD : ActionBar_Right;
		return (
			<Column style={ES({ flex: 1 })}>
				{!withinPage &&
					<ActionBar_Left_Final map={map} subNavBarWidth={subNavBarWidth}/>}
				{!withinPage &&
					<ActionBar_Right_Final map={map} subNavBarWidth={subNavBarWidth}/>}
				{/* !withinPage &&
					<TimelinePlayerUI map={map}/> */}
				{/*! withinPage &&
					<TimelineOverlayUI map={map}/> */}
				<Row style={{ marginTop: 30, height: 'calc(100% - 30px)', alignItems: 'flex-start' }}>
					{!withinPage && timelinePanelOpen &&
						<TimelinePanel map={map}/>}
					<ScrollView {...rest.Excluding(...StandardCompProps())} ref={c => this.scrollView = c}
						backgroundDrag={true} backgroundDragMatchFunc={a => a == GetDOM(this.scrollView.content) || a == this.mapUI}
						style={ES({ height: '100%' }, withinPage && { overflow: 'visible' })}
						scrollHBarStyle={E({ height: 10 }, withinPage && { display: 'none' })} scrollVBarStyle={E({ width: 10 }, withinPage && { display: 'none' })}
						contentStyle={E(
							{ willChange: 'transform' },
							withinPage && { position: 'relative', marginBottom: -300, paddingBottom: 300 },
							withinPage && inFirefox && { overflow: 'hidden' },
						)}
						// contentStyle={E({willChange: "transform"}, withinPage && {marginTop: -300, paddingBottom: 300, transform: "translateY(300px)"})}
						// bufferScrollEventsBy={10000}
						onScrollEnd={(pos) => {
							// if (withinPage) return;
							UpdateFocusNodeAndViewOffset(map._key);
						}}
					>
						<style>{`
						.MapUI {
							display: inline-flex;
							//flex-wrap: wrap;
						}
						.MapUI.scrolling > * { pointer-events: none; }
						`}</style>
						<div className="MapUI" ref={c => this.mapUI = c}
							style={{
								position: 'relative', /* display: "flex", */ whiteSpace: 'nowrap',
								padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
								alignItems: 'center',
								filter: GADDemo ? 'drop-shadow(rgba(0,0,0,.7) 0px 0px 10px)' : 'drop-shadow(rgba(0,0,0,1) 0px 0px 10px)',
							}}
							onMouseDown={(e) => {
								this.downPos = new Vector2i(e.clientX, e.clientY);
								if (e.button == 2) { $(this.mapUI).addClass('scrolling'); }
							}}
							onMouseUp={(e) => {
								$(this.mapUI).removeClass('scrolling');
							}}
							onClick={(e) => {
								if (e.target != this.mapUI) return;
								if (this.downPos && new Vector2i(e.clientX, e.clientY).DistanceTo(this.downPos) >= 3) return;
								const mapView = GetMapView(GetOpenMapID());
								if (GetSelectedNodePath(map._key)) {
									store.dispatch(new ACTMapNodeSelect({ mapID: map._key, path: null }));
									// UpdateFocusNodeAndViewOffset(map._id);
								}
							}}
							onContextMenu={(e) => {
								if (e.nativeEvent['passThrough']) return true;
								e.preventDefault();
							}}
						>
							{playingTimeline != null &&
							<TimelineIntroBox timeline={playingTimeline}/>}
							<NodeUI indexInNodeList={0} map={map} node={rootNode} path={(Assert(rootNode._key != null), rootNode._key.toString())}/>
							{/* <ReactResizeDetector handleWidth handleHeight onResize={()=> { */}
							{/* <ResizeSensor ref="resizeSensor" onResize={()=> {
								this.LoadScroll();
							}}/> */}
							<VMenuStub preOpen={e => e.passThrough != true}>
								<VMenuItem text="(To add a node, right click on an existing node.)" style={styles.vMenuItem}/>
							</VMenuStub>
						</div>
					</ScrollView>
				</Row>
			</Column>
		);
	}

	async ComponentDidMount() {
		MapUI.currentMapUI = this;


		NodeUI.renderCount = 0;
		/* NodeUI.lastRenderTime = Date.now();
		let lastRenderCount = 0; */

		for (let i = 0; i < 30 && this.props.map == null; i++) await SleepAsync(100);
		const { map } = this.props;
		if (map == null) return;

		this.StartLoadingScroll();
	}
	ComponentWillUnmount() {
		MapUI.currentMapUI = null;
	}

	StartLoadingScroll() {
		const { map } = this.props;

		/* let playingTimeline = await GetAsync(()=>GetPlayingTimeline(map._id));
		if (!playingTimeline) { */ // only load-scroll if not playing timeline; timeline gets priority, to focus on its latest-revealed nodes

		/*
		let timer = new Timer(100, ()=> {
			if (!this.mounted) return timer.Stop();

			// if more nodes have been rendered (ie, new nodes have come in)
			if (NodeUI.renderCount > lastRenderCount) {
				this.LoadScroll();
			}
			lastRenderCount = NodeUI.renderCount;

			let timeSinceLastNodeUIRender = Date.now() - NodeUI.lastRenderTime;
			if (NodeUI.renderCount > 0 && timeSinceLastNodeUIRender >= 1500) {
				this.OnLoadComplete();
				timer.Stop();
			}
		}).Start(); */

		const focusNodePath = GetFocusedNodePath(map._key);

		let lastFoundPath = '';
		const timer = new Timer(100, () => {
			if (!this.mounted) return timer.Stop();

			// if more nodes have been rendered, along the path to the focus-node
			const foundBox = this.FindNodeBox(focusNodePath, true);
			const foundPath = foundBox ? foundBox.props.path : '';
			if (foundPath.length > lastFoundPath.length) {
				this.LoadScroll();
			}
			lastFoundPath = foundPath;

			if (foundPath == focusNodePath && this.scrollView) {
				this.OnLoadComplete();
				timer.Stop();
			}
		}).Start();
		// }

		// start scroll at root // (this doesn't actually look as good)
		/* if (this.scrollView)
			this.scrollView.ScrollBy({x: MapUI.padding.leftAndRight, y: MapUI.padding.topAndBottom}); */
	}
	OnLoadComplete() {
		console.log(`
			NodeUI render count: ${NodeUI.renderCount} (${NodeUI.renderCount / $('.NodeUI').length} per visible node)
			TimeSincePageLoad: ${Date.now() - performance.timing.domComplete}ms
		`.AsMultiline(0));
		this.LoadScroll();
		// UpdateURL(false);
	}

	PostRender() {
		const { map, withinPage } = this.props;
		/* if (withinPage && this.scrollView) {
			this.scrollView.vScrollableDOM = $('#HomeScrollView').children('.content')[0];
		} */
		if (map) {
			SetMapVisitTimeForThisSession(map._key, Date.now());
		}
	}

	// load scroll from store
	LoadScroll() {
		const { map, rootNode, withinPage } = this.props;
		if (this.scrollView == null) return;
		if (this.scrollView.state.scrollOp_bar) return; // if user is already scrolling manually, don't interrupt

		const focusNode_target = GetFocusedNodePath(GetMapView(map._key)); // || map.rootNode.toString();
		this.ScrollToNode(focusNode_target);
	}

	FindNodeBox(nodePath: string, ifMissingFindAncestor = false) {
		let focusNodeBox;
		let nextPathTry = nodePath;
		while (focusNodeBox == null) {
			focusNodeBox = $('.NodeUI_Inner').ToList().FirstOrX((nodeBox) => {
				// let comp = FindReact(nodeBox[0]) as NodeUI_Inner;
				const comp = FindReact(nodeBox[0]).props.parent as NodeUI_Inner;
				// if comp is null, just ignore (an error must have occured, but we don't want to handle it here)
				if (comp == null) return false;
				return comp.props.path == nextPathTry;
			});
			if (!ifMissingFindAncestor || !nextPathTry.Contains('/')) break;
			nextPathTry = nextPathTry.substr(0, nextPathTry.lastIndexOf('/'));
		}
		if (focusNodeBox == null) return null;
		return FindReact(focusNodeBox[0]).props.parent as NodeUI_Inner;
	}
	ScrollToNode(nodePath: string) {
		const { map, rootNode, withinPage } = this.props;

		const viewOffset_target = GetViewOffset(GetMapView(map._key)); // || new Vector2i(200, 0);
		// Log(`LoadingScroll:${nodePath};${ToJSON(viewOffset_target)}`);
		if (nodePath == null || viewOffset_target == null) return;

		const focusNodeBox = this.FindNodeBox(nodePath, true);
		if (focusNodeBox == null) return;
		const focusNodeBoxPos = $(GetDOM(focusNodeBox)).GetScreenRect().Center.Minus($(this.mapUI).GetScreenRect().Position);
		this.ScrollToPosition_Center(focusNodeBoxPos.Plus(viewOffset_target));
	}
	ScrollToPosition_Center(posInContainer: Vector2i) {
		const { map, rootNode, withinPage } = this.props;

		const oldScroll = this.scrollView.GetScroll();
		const newScroll = new Vector2i(posInContainer.x - (window.innerWidth / 2), posInContainer.y - (window.innerHeight / 2));
		if (withinPage) { // if within a page, don't apply stored vertical-scroll
			newScroll.y = oldScroll.y;
		}
		this.scrollView.SetScroll(newScroll);
		// Log("Scrolling to position: " + newScroll);

		/* if (nextPathTry == nodePath)
			this.hasLoadedScroll = true; */
	}
}

window.addEventListener('beforeunload', () => {
	const mapID = GetOpenMapID();
	SetMapVisitTimeForThisSession(mapID, Date.now());
});

function SetMapVisitTimeForThisSession(mapID: string, time: number) {
	if (mapID == null) return;
	const lastMapViewTimes = FromJSON(localStorage.getItem(`lastMapViewTimes_${mapID}`) || `[${Date.now()}]`) as number[];

	const mapsViewedThisSession = g.mapsViewedThisSession || {};
	if (mapsViewedThisSession[mapID] == null) {
		lastMapViewTimes.Insert(0, Date.now());
		if (lastMapViewTimes.length > 10) lastMapViewTimes.splice(-1, 1);
	} else {
		lastMapViewTimes[0] = Date.now();
	}

	localStorage.setItem(`lastMapViewTimes_${mapID}`, ToJSON(lastMapViewTimes));
	mapsViewedThisSession[mapID] = true;
	G({ mapsViewedThisSession });
}
