import chroma from 'chroma-js';
import { Vector2i, VURL } from 'js-vextensions';
import * as ReactColor from 'react-color';
import { Provider } from 'react-redux';
import { ColorPickerBox, Column } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector, ShallowChanged } from 'react-vextensions';
import { VMenuLayer } from 'react-vmenu';
import { MessageBoxUI } from 'react-vmessagebox';
import { RouterProvider } from 'redux-little-router';
import { PersistGate as PersistGate_ } from 'redux-persist/integration/react';
import { GetUserID } from 'Store/firebase/users';
import { AddressBarWrapper } from 'UI/@Shared/AddressBarWrapper';
import GuideUI from 'UI/Guide';
import '../../Source/Frame/Styles/Core.scss'; // keep absolute-ish, since scss file not copied to Source_JS folder
import { Connect } from '../Frame/Database/FirebaseConnect';
import { NormalizeURL } from '../Frame/General/URLs';
import Route from '../Frame/ReactComponents/Route';
import '../Frame/UI/JQueryExtensions';
import { GetUserBackground } from '../Store/firebase/users';
import { NavBar } from '../UI/@Shared/NavBar';
import { GlobalUI } from '../UI/Global';
import { HomeUI } from '../UI/Home';
import { MoreUI } from '../UI/More';
import ChatUI from './Chat';
import { DatabaseUI } from './Database';
import { DebatesUI } from './Debates';
import { FeedbackUI } from './Feedback';
import ForumUI from './Forum';
import { PersonalUI } from './Personal';
import { ProfileUI } from './Profile';
import ReputationUI from './Reputation';
import SearchUI from './Search';
import SocialUI from './Social';
import StreamUI from './Stream';

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
			<Provider store={store}>
				<PersistGate loading={null} persistor={persister}>
					<RouterProvider store={store}>
						<RootUI/>
					</RouterProvider>
				</PersistGate>
			</Provider>
		);
	}

	ComponentDidMount() {
		if (DEV) {
			setTimeout(() => {
				G({Perf: React.addons.Perf});
				React.addons.Perf.start();
			}, 100);
		}

		// $(document).on('mousemove', '*', function(event, ui) {
		document.addEventListener('mousemove', (event) => {
			if (event['handledGlobally']) return;
			event['handledGlobally'] = true;

			g.mousePos = new Vector2i(event.pageX, event.pageY);
		});
	}
}

let connector = (state, {}: {})=> ({
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
		const background = GetUserBackground(GetUserID());
		return (
			<Column className='background'/*'unselectable'*/ style={{height: '100%'}}>
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
				{/*<InfoButton_TooltipWrapper/>*/}
				<main style={ES({position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'})}>
					<Route path='/stream'><StreamUI/></Route>
					<Route path='/chat'><ChatUI/></Route>
					<Route path='/reputation'><ReputationUI/></Route>

					<Route path='/database'><DatabaseUI/></Route>
					<Route path='/forum'><ForumUI/></Route>
					<Route path='/feedback'><FeedbackUI/></Route>
					<Route path='/more'><MoreUI/></Route>
					<Route withConditions={url=>NormalizeURL(VURL.FromState(url)).pathNodes[0] == 'home'}><HomeUI/></Route>
					<Route path='/social'><SocialUI/></Route>
					<Route path='/personal'><PersonalUI/></Route>
					<Route path='/debates'><DebatesUI/></Route>
					<Route path='/global'><GlobalUI/></Route>

					<Route path='/search'><SearchUI/></Route>
					<Route path='/guide'><GuideUI/></Route>
					<Route path='/profile'><ProfileUI/></Route>
				</main>
			</Column>
		);
	}
}

class OverlayUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<div style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden'}}>
				<MessageBoxUI/>
				<VMenuLayer/>
			</div>
		);
	}
}