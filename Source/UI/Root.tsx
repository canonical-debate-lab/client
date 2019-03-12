import chroma from 'chroma-js';
import { Vector2i, VURL, FromJSON } from 'js-vextensions';
import * as ReactColor from 'react-color';
import { Provider } from 'react-redux';
import { ColorPickerBox, Column } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector, ShallowChanged } from 'react-vextensions';
import { VMenuLayer } from 'react-vmenu';
import { MessageBoxUI } from 'react-vmessagebox';
import { PersistGate as PersistGate_ } from 'redux-persist/integration/react';
import { MeID, Me } from 'Store/firebase/users';
import { GuideUI } from 'UI/Guide';
import '../../Source/Utils/Styles/Main.scss'; // keep absolute-ish, since scss file not copied to Source_JS folder
import '../Utils/UI/JQueryExtensions';
import keycode from 'keycode';
import { State, Connect, Route, browserHistory, AddressBarWrapper } from 'Utils/FrameworkOverrides';
import { NormalizeURL } from 'Utils/URL/URLs';
import { ConnectedRouter } from 'connected-react-router';
import { ES } from 'Utils/UI/GlobalStyles';
import { DragDropContext as DragDropContext_Beautiful, Droppable } from 'react-beautiful-dnd';
import { DraggableInfo, DroppableInfo } from 'Utils/UI/DNDStructures';
import { GetUserBackground } from '../Store/firebase/users';
import { NavBar } from '../UI/@Shared/NavBar';
import { GlobalUI } from '../UI/Global';
import { HomeUI } from '../UI/Home';
import { MoreUI } from '../UI/More';
import { ChatUI } from './Chat';
import { DatabaseUI } from './Database';
import { DebatesUI } from './Debates';
import { FeedbackUI } from './Feedback';
import { ForumUI } from './Forum';
import { PersonalUI } from './Personal';
import { UserProfileUI } from './Database/Users/UserProfile';
import { ReputationUI } from './Reputation';
import { SearchUI } from './Search';
import { SocialUI } from './Social';
import { StreamUI } from './Stream';

const aa = { Provider, ConnectedRouter } as any;

// temp fix for "isOver({shallow: true})"
// var DragDropMonitor = require("dnd-core/lib/DragDropMonitor").default;
let DragDropMonitor = require('dnd-core/lib/DragDropMonitorImpl').default; // eslint-disable-line
DragDropMonitor.prototype.GetTargetComponents = function () { // eslint-disable-line
	return this.getTargetIds().map(targetID => this.registry.handlers[targetID].component);
};
/* var createTargetMonitor = require("react-dnd/lib/createTargetMonitor").default;
var TargetMonitor = createTargetMonitor({getMonitor: function() {}}).constructor;
TargetMonitor.prototype.GetTargetComponent = function() {
    return this.internalMonitor.registry.handlers[this.targetId].component;
}; */

const PersistGate = PersistGate_ as any;

ColorPickerBox.Init(ReactColor, chroma);

export class RootUIWrapper extends BaseComponent<{store}, {}> {
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

	render() {
		const { store } = this.props;
		// if (!g.storeRehydrated) return <div/>;

		return (
			<aa.Provider store={store}>
				<PersistGate loading={null} persistor={persister}>
					<aa.ConnectedRouter history={browserHistory}>
						<DragDropContext_Beautiful onDragEnd={this.OnDragEnd}>
							<RootUI/>
						</DragDropContext_Beautiful>
					</aa.ConnectedRouter>
				</PersistGate>
			</aa.Provider>
		);
	}

	OnDragEnd = (result) => {
		const sourceDroppableInfo = FromJSON(result.source.droppableId) as DroppableInfo;
		const sourceIndex = result.source.index as number;
		const targetDroppableInfo = result.destination && FromJSON(result.destination.droppableId) as DroppableInfo;
		const targetIndex = result.destination && result.destination.index as number;
		const draggableInfo = FromJSON(result.draggableId) as DraggableInfo;

		if (targetDroppableInfo == null) {
		} else if (targetDroppableInfo.type == 'NodeChildHolder') {
			// todo
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

const connector = (state, {}: {}) => ({
	currentPage: State(a => a.main.page),
});
@Connect(connector)
class RootUI extends BaseComponentWithConnector(connector, {}) {
	shouldComponentUpdate(newProps, newState) {
		// ignore change of 'router' prop -- we don't use it
		return ShallowChanged(newProps.Excluding('router'), this.props.Excluding('router')) || ShallowChanged(newState, this.state);
	}
	render() {
		// let {currentPage} = this.props;
		const background = GetUserBackground(MeID());
		return (
			<Column className='background'/* 'unselectable' */ style={{ height: '100%' }}>
				{/* <div className='background' style={{
					position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: .5,
				}}/> */}
				<style>{`
				.background {
					background-color: ${background.color};
					background-image: url(${background.url_1920}); /*, url(/Images/Backgrounds/Ocean_x1920.jpg);*/
					background-position: ${background.position || 'center center'};
					background-size: cover;
				}
				@media (min-width: 1921px) {
					.background {
						background-image: url(${background.url_3840}); /*, url(/Images/Backgrounds/Ocean_x3840.jpg);*/
					}
				}
				`}</style>
				<AddressBarWrapper/>
				<OverlayUI/>
				<NavBar/>
				{/* <InfoButton_TooltipWrapper/> */}
				<main style={ES({ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' })}>
					<Route path='/stream'><StreamUI/></Route>
					<Route path='/chat'><ChatUI/></Route>
					<Route path='/reputation'><ReputationUI/></Route>

					<Route path='/database'><DatabaseUI/></Route>
					<Route path='/forum'><ForumUI/></Route>
					<Route path='/feedback'><FeedbackUI/></Route>
					<Route path='/more'><MoreUI/></Route>
					<Route withConditions={url => NormalizeURL(VURL.FromLocationObject(url)).pathNodes[0] == 'home'}><HomeUI/></Route>
					<Route path='/social'><SocialUI/></Route>
					<Route path='/personal'><PersonalUI/></Route>
					<Route path='/debates'><DebatesUI/></Route>
					<Route path='/global'><GlobalUI/></Route>

					<Route path='/search'><SearchUI/></Route>
					<Route path='/guide'><GuideUI/></Route>
					<Route path='/profile'><UserProfileUI profileUser={Me()}/></Route>
				</main>
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
