import chroma from 'chroma-js';
import { ConnectedRouter } from 'connected-react-router';
import { FromJSON, Vector2i, VURL } from 'js-vextensions';
import keycode from 'keycode';
import { getSnapshot } from 'mobx-state-tree';
import { persist } from 'mst-persist';
import React, { useCallback } from 'react';
import { DragDropContext as DragDropContext_Beautiful } from 'react-beautiful-dnd';
import * as ReactColor from 'react-color';
import ReactDOM from 'react-dom';
import { Button, ColorPickerBox, Column } from 'react-vcomponents';
import { BaseComponent, BaseComponentPlus } from 'react-vextensions';
import { VMenuLayer } from 'react-vmenu';
import { MessageBoxUI, ShowMessageBox } from 'react-vmessagebox';
import { CreateLinkCommand as CreateLinkCommandForDND, LinkNode_HighLevel_GetCommandError } from 'Server/Commands/LinkNode_HighLevel';
import { UpdateTimelineStep } from 'Server/Commands/UpdateTimelineStep';
import { UpdateTimelineStepOrder } from 'Server/Commands/UpdateTimelineStepOrder';
import { InitStore, store } from 'Store';
import { GetNode, GetNodeID, GetParentNode, GetParentPath } from 'Store_Old/firebase/nodes';
import { GetNodeDisplayText, GetNodeL3, IsPremiseOfSinglePremiseArgument } from 'Store_Old/firebase/nodes/$node';
import { Polarity } from 'Store_Old/firebase/nodes/@MapNode';
import { GetTimelineStep } from 'Store_Old/firebase/timelines';
import { NodeReveal } from 'Store_Old/firebase/timelineSteps/@TimelineStep';
import { Me, MeID } from 'Store_Old/firebase/users';
import { ACTSetLastAcknowledgementTime } from 'Store_Old/main';
import { GetPathNodeIDs } from 'Store_Old/main/mapViews';
import { AddressBarWrapper, browserHistory, ErrorBoundary, Route } from 'Utils/FrameworkOverrides';
import { DraggableInfo, DroppableInfo } from 'Utils/UI/DNDStructures';
import { NormalizeURL } from 'Utils/URL/URLs';
import '../../Source/Utils/Styles/Main.scss'; // keep absolute-ish, since scss file not copied to Source_JS folder
import { GetUserBackground } from '../Store_Old/firebase/users';
import { NavBar } from '../UI/@Shared/NavBar';
import { GlobalUI } from '../UI/Global';
import { HomeUI } from '../UI/Home';
import { MoreUI } from '../UI/More';
import '../Utils/UI/JQueryExtensions';
import { GADDemo } from './@GAD/GAD';
import { HomeUI_GAD } from './@GAD/Home_GAD';
import { NavBar_GAD } from './@GAD/NavBar_GAD';
import { DatabaseUI } from './Database';
import { UserProfileUI } from './Database/Users/UserProfile';
import { DebatesUI } from './Debates';
import { FeedbackUI } from './Feedback';
import { ForumUI } from './Forum';
import { PersonalUI } from './Personal';
import { SocialUI } from './Social';

ColorPickerBox.Init(ReactColor, chroma);

export class RootUIWrapper extends BaseComponentPlus({}, { storeReady: false }) {
	/* ComponentWillMount() {
		let startVal = g.storeRehydrated;
		// wrap storeRehydrated property, so we know when it's set (from CreateStore.ts callback)
		(g as Object)._AddGetterSetter('storeRehydrated',
			()=>g.storeRehydrated_,
			val=> {
				g.storeRehydrated_ = val;
				setTimeout(()=>this.mounted && this.Update());//
			});
		// trigger setter right now (in case value is already true)
		g.storeRehydrated = startVal;
	} */
	ComponentWillMount() {
		InitStore();

		// temp fix for "Illegal invocation" error in mst-persist
		window.localStorage.getItem = window.localStorage.getItem.bind(window.localStorage);
		window.localStorage.setItem = window.localStorage.setItem.bind(window.localStorage);
		persist('some', store, {
			// jsonify: false,
			// whitelist: ['name']
			blacklist: [],
		}).then(() => {
			Log('Loaded state:', getSnapshot(store));
			this.SetState({ storeReady: true });
		});
	}

	render() {
		const { storeReady } = this.state;
		// if (!g.storeRehydrated) return <div/>;
		if (!storeReady) return null;

		return (
			<ConnectedRouter history={browserHistory}>
				<DragDropContext_Beautiful onDragEnd={this.OnDragEnd}>
					<RootUI/>
				</DragDropContext_Beautiful>
			</ConnectedRouter>
		);
	}

	OnDragEnd = (result) => {
		const sourceDroppableInfo = FromJSON(result.source.droppableId) as DroppableInfo;
		const sourceIndex = result.source.index as number;
		const targetDroppableInfo = result.destination && FromJSON(result.destination.droppableId) as DroppableInfo;
		let targetIndex = result.destination && result.destination.index as number;
		const draggableInfo = FromJSON(result.draggableId) as DraggableInfo;

		if (targetDroppableInfo == null) {
		} else if (targetDroppableInfo.type == 'NodeChildHolder') {
			// we don't support setting the actual order for nodes through dnd right now, so ignore if dragging onto same list
			if (result.destination && result.source.droppableId == result.destination.droppableId) return;

			const { parentPath: newParentPath } = targetDroppableInfo;
			const newParentID = GetPathNodeIDs(newParentPath).Last();
			const newParent = GetNodeL3(newParentID);
			const polarity = targetDroppableInfo.subtype == 'up' ? Polarity.Supporting : Polarity.Opposing;

			const { mapID, nodePath: draggedNodePath } = draggableInfo;
			const draggedNodeID = GetPathNodeIDs(draggedNodePath).Last();
			const draggedNode = GetNodeL3(draggedNodeID);

			const copyCommand = CreateLinkCommandForDND(mapID, draggedNodePath, newParentPath, polarity, true);
			const moveCommand = CreateLinkCommandForDND(mapID, draggedNodePath, newParentPath, polarity, false);

			const copyCommand_error = LinkNode_HighLevel_GetCommandError(copyCommand, draggedNodePath, newParentPath);
			if (copyCommand_error) {
				ShowMessageBox({ title: 'Cannot copy/move node', message: `Reason: ${copyCommand_error}` });
				return;
			}

			const moveCommand_error = LinkNode_HighLevel_GetCommandError(moveCommand, draggedNodePath, newParentPath);

			const controller = ShowMessageBox({
				title: 'Copy/move the dragged node?', okButton: false, cancelButton: false,
				message: `
					Are you sure you want to copy/move the dragged node?

					Destination (new parent): ${GetNodeDisplayText(newParent)}
					Dragged claim/argument: ${GetNodeDisplayText(draggedNode)}
				`.AsMultiline(0),
				extraButtons: () => <>
					<Button text="Copy" onClick={async () => {
						controller.Close();
						const { argumentWrapperID } = await copyCommand.Run();
						if (argumentWrapperID) {
							store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: argumentWrapperID, time: Date.now() }));
						}
					}}/>
					<Button ml={5} text="Move" enabled={moveCommand_error == null} title={moveCommand_error} onClick={async () => {
						controller.Close();
						const { argumentWrapperID } = await moveCommand.Run();
						if (argumentWrapperID) {
							store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: argumentWrapperID, time: Date.now() }));
						}
					}}/>
					<Button ml={5} text="Cancel" onClick={() => controller.Close()}/>
				</>,
			});
		} else if (targetDroppableInfo.type == 'TimelineStepList') {
			// if we're moving an item to later in the same list, increment the target-index again (since react-beautiful-dnd pre-applies target-index adjustment, unlike the rest of our code that uses UpdateTimelineStepsOrder/Array.Move())
			if (sourceDroppableInfo.type == targetDroppableInfo.type && sourceIndex < targetIndex) {
				targetIndex++;
			}

			new UpdateTimelineStepOrder({ timelineID: sourceDroppableInfo.timelineID, stepID: draggableInfo.stepID, newIndex: targetIndex }).Run();
		} else if (targetDroppableInfo.type == 'TimelineStepNodeRevealList') {
			let path = draggableInfo.nodePath;
			const draggedNode = GetNode(GetNodeID(path));
			const parentNode = GetParentNode(path);
			// if dragged-node is the premise of a single-premise argument, use the argument-node instead (the UI for the argument and claim are combined, but user probably wanted the whole argument dragged)
			if (IsPremiseOfSinglePremiseArgument(draggedNode, parentNode)) {
				path = GetParentPath(path);
			}

			const step = GetTimelineStep(targetDroppableInfo.stepID);
			const newNodeReveal = new NodeReveal();
			newNodeReveal.path = path;
			const newNodeReveals = (step.nodeReveals || []).concat(newNodeReveal);
			new UpdateTimelineStep({ stepID: step._key, stepUpdates: { nodeReveals: newNodeReveals } }).Run();
		}
	};

	ComponentDidMount() {
		/* if (DEV) {
			setTimeout(() => {
				G({ Perf: React.addons.Perf });
				React.addons.Perf.start();
			}, 100);
		} */

		// $(document).on('mousemove', '*', function(event, ui) {
		document.addEventListener('mousemove', (event) => {
			if (event['handledGlobally']) return;
			event['handledGlobally'] = true;

			g.mousePos = new Vector2i(event.pageX, event.pageY);
		});

		document.addEventListener('keydown', (event) => {
			if (event.which == keycode.codes.ctrl) g.ctrlDown = true;
			if (event.which == keycode.codes.shift) g.shiftDown = true;
			if (event.which == keycode.codes.alt) g.altDown = true;
		});
		document.addEventListener('keyup', (event) => {
			if (event.which == keycode.codes.ctrl) g.ctrlDown = false;
			if (event.which == keycode.codes.shift) g.shiftDown = false;
			if (event.which == keycode.codes.alt) g.altDown = false;
		});

		// if in dev-mode, disable the body`s minHeight attribute
		if (DEV) {
			document.body.style.minHeight = null;
		}

		if (GADDemo) {
			const linkEl = <link href="//fonts.googleapis.com/css?family=Cinzel&display=swap" rel="stylesheet"/>;
			ReactDOM.render(ReactDOM.createPortal(linkEl, document.head), document.createElement('div')); // render directly into head

			// const linkEl2 = <link rel="stylesheet" media="screen" href="https://fontlibrary.org/face/bebasneueregular" type="text/css"/>;
			// const linkEl2 = <link rel="stylesheet" media="screen" href="https://cdn.jsdelivr.net/npm/@typopro/web-bebas-neue@3.7.5/TypoPRO-BebasNeue-Bold.css" type="text/css"/>;
			const linkEl2 = <link rel="stylesheet" media="screen" href="//cdn.jsdelivr.net/npm/@typopro/web-bebas-neue@3.7.5/TypoPRO-BebasNeue.css" type="text/css"/>;
			// const linkEl2 = <link rel="stylesheet" media="screen" href="https://cdn.jsdelivr.net/npm/@typopro/web-bebas-neue@3.7.5/TypoPRO-BebasNeue-Thin.css" type="text/css"/>;
			ReactDOM.render(ReactDOM.createPortal(linkEl2, document.head), document.createElement('div')); // render directly into head
		}
	}
}

declare global {
	var mousePos: Vector2i;
	var ctrlDown: boolean;
	var shiftDown: boolean;
	var altDown: boolean;
}
g.mousePos = new Vector2i(undefined, undefined);
G({ ctrlDown: false, shiftDown: false, altDown: false });

class RootUI extends BaseComponentPlus({} as {}, {}) {
	/* shouldComponentUpdate(newProps, newState) {
		// ignore change of 'router' prop -- we don't use it
		return ShallowChanged(newProps.Excluding('router'), this.props.Excluding('router')) || ShallowChanged(newState, this.state);
	} */
	render() {
		// const currentPage = State.Watch(a => a.main.page);
		const background = GetUserBackground(MeID());
		return (
			<Column className='background'/* 'unselectable' */ style={{ height: '100%' }}>
				{/* <div className='background' style={{
					position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: .5,
				}}/> */}
				<style>{`
				.background {
					background-color: ${background.color};
					background-image: url(${background.url_1920 || background.url_3840 || background.url_max});
					background-position: ${background.position || 'center center'};
					background-size: ${background.size || 'cover'};
				}
				@media (min-width: 1921px) {
					.background {
						background-image: url(${background.url_3840 || background.url_max});
					}
				}
				@media (min-width: 3841px) {
					.background {
						background-image: url(${background.url_max});
					}
				}
				`}</style>
				<AddressBarWrapper/>
				<OverlayUI/>
				{!GADDemo && <NavBar/>}
				{GADDemo && <NavBar_GAD/>}
				{/* <InfoButton_TooltipWrapper/> */}
				<ErrorBoundary>
					<main style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
						{/* <Route path='/stream'><StreamUI/></Route>
						<Route path='/chat'><ChatUI/></Route>
						<Route path='/reputation'><ReputationUI/></Route> */}

						<Route path='/database'><DatabaseUI/></Route>
						<Route path='/forum'><ForumUI/></Route>
						<Route path='/feedback'><FeedbackUI/></Route>
						<Route path='/more'><MoreUI/></Route>
						<Route withConditions={useCallback((url) => NormalizeURL(VURL.FromLocationObject(url)).pathNodes[0] == 'home', [])}>
							{!GADDemo && <HomeUI/>}
							{GADDemo && <HomeUI_GAD/>}
						</Route>
						<Route path='/social'><SocialUI/></Route>
						<Route path='/personal'><PersonalUI/></Route>
						<Route path='/debates'><DebatesUI/></Route>
						<Route path='/global'><GlobalUI/></Route>

						{/* <Route path='/search'><SearchUI/></Route>
						<Route path='/guide'><GuideUI/></Route> */}
						<Route path='/profile'><UserProfileUI profileUser={Me()}/></Route>
					</main>
				</ErrorBoundary>
			</Column>
		);
	}
}

class OverlayUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>
				<MessageBoxUI/>
				<VMenuLayer/>
			</div>
		);
	}
}
