import { DeepGet, E } from 'js-vextensions';
import { Button, Div, Row } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { ACTDebateMapSelect } from 'Store/main/debates';
import { ResetCurrentDBRoot } from 'UI/More/Admin/ResetCurrentDBRoot';
import { dbVersion } from 'Main';
import { Connect, State, Action, Link, GetData } from 'Utils/FrameworkOverrides';
import { ACTUserSelect } from 'Store/main/database';
import { colors } from '../../Utils/UI/GlobalStyles';
import { ACTSetPage, ACTSetSubpage, ACTTopLeftOpenPanelSet, ACTTopRightOpenPanelSet } from '../../Store/main';
import { ACTPersonalMapSelect } from '../../Store/main/personal';
import { ChatPanel } from './NavBar/ChatPanel';
import { GuidePanel } from './NavBar/GuidePanel';
import { NotificationsUI } from './NavBar/NotificationsUI';
import { ReputationPanel } from './NavBar/ReputationPanel';
import { SearchPanel } from './NavBar/SearchPanel';
import { StreamPanel } from './NavBar/StreamPanel';
import { UserPanel } from './NavBar/UserPanel';

// main
// ==========

const originSettings = { horizontal: 'right', vertical: 'top' };
const buttonStyle = { color: 'white', textDecoration: 'none' };
const avatarSize = 50;

const avatarStyles = {
	icon: { width: avatarSize, height: avatarSize },
	button: { marginRight: '1.5rem', width: avatarSize, height: avatarSize },
	wrapper: { marginTop: 45 - avatarSize },
};

const connector = (state, {}: {}) => ({
	topLeftOpenPanel: State(a => a.main.topLeftOpenPanel),
	topRightOpenPanel: State(a => a.main.topRightOpenPanel),
	auth: State(a => a.firebase.auth),
	dbNeedsInit: GetData({ collection: true, useUndefinedForInProgress: true }, 'nodeRevisions') === null,
});
@Connect(connector)
export class NavBar extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { topLeftOpenPanel, topRightOpenPanel, auth, dbNeedsInit } = this.props;
		return (
			<nav style={{
				position: 'relative', zIndex: 11, padding: '0 10px', boxShadow: colors.navBarBoxShadow,
				// background: "#000 url('/Images/Tiling/TopMenu.png') repeat-x scroll",
				background: 'rgba(0,0,0,1)',
			}}>
				<div style={{ display: 'flex' }}>
					<span style={{ position: 'absolute', left: 0 }}>
						{/* <NavBarPanelButton text="Stream" panel="stream" corner="top-left"/>
						<NavBarPanelButton text="Chat" panel="chat" corner="top-left"/>
						<NavBarPanelButton text={
							<Div className="cursorSet" style={{position: "relative", height: 45}}>
								<Div style={{color: "rgba(255,255,255,1)", justifyContent: "center"}}>Rep: n/a</Div>
								{/*<Div style={{color: "rgba(255,255,255,1)", justifyContent: "center"}}>Rep: 100</Div>
								<Div style={{position: "absolute", bottom: 3, width: "100%", textAlign: "center",
									fontSize: 11, lineHeight: "11px", color: "rgba(0,255,0,.7)"}}>+100</Div>*#/}
							</Div> as any
						} panel="reputation" corner="top-left"/> */}
					</span>
					<div style={{
						position: 'fixed', display: 'flex', zIndex: 11, left: 0, top: 45, maxHeight: 'calc(100% - 45px - 30px)',
						boxShadow: colors.navBarBoxShadow, clipPath: 'inset(0 -150px -150px 0)', // display: 'table'
					}}>
						{topLeftOpenPanel == 'stream' && <StreamPanel/>}
						{topLeftOpenPanel == 'chat' && <ChatPanel/>}
						{topLeftOpenPanel == 'reputation' && <ReputationPanel/>}
					</div>
					<Div ct style={{ position: 'fixed', left: 0, width: '30%', top: 45, bottom: 0 }}>
						{dbNeedsInit && startURL.GetQueryVar('init') &&
							<Row>
								<Button text="Initialize database" onClick={() => {
									const boxController = ShowMessageBox({
										title: 'Initialize database?', cancelButton: true,
										message: `Initialize database content under db-root ${dbVersion}?`,
										onOK: () => {
											ResetCurrentDBRoot();
										},
									});
								}}/>
							</Row>}
						<NotificationsUI/>
					</Div>

					<span style={{ margin: '0 auto', paddingLeft: 78 }}>
						<NavBarPageButton page="database" text="Database"/>
						<NavBarPageButton page="feedback" text="Feedback"/>
						{/* <NavBarButton page="forum" text="Forum"/> */}
						<NavBarPageButton page="more" text="More"/>
						<NavBarPageButton page="home" text="Canonical Debate" style={{ margin: '0 auto', textAlign: 'center', fontSize: 23 }}/>
						<NavBarPageButton page="personal" text="Personal"/>
						<NavBarPageButton page="debates" text="Debates"/>
						<NavBarPageButton page="global" text="Global"/>
					</span>

					<span style={{ position: 'absolute', right: 0, display: 'flex' }}>
						<NavBarPanelButton text="Search" panel="search" corner="top-right"/>
						{/* <NavBarPanelButton text="Guide" panel="guide" corner="top-right"/> */}
						<NavBarPanelButton text={DeepGet(auth, 'displayName') ? auth.displayName.match(/(.+?)( |$)/)[1] : 'Sign in'} panel="profile" corner="top-right"/>
					</span>
					<div style={{
						position: 'fixed', display: 'flex', zIndex: 11, right: 0, top: 45, maxHeight: 'calc(100% - 45px - 30px)',
						boxShadow: colors.navBarBoxShadow, clipPath: 'inset(0 0 -150px -150px)', // display: 'table',
					}}>
						{topRightOpenPanel == 'search' && <SearchPanel/>}
						{topRightOpenPanel == 'guide' && <GuidePanel/>}
						{topRightOpenPanel == 'profile' && <UserPanel/>}
					</div>
				</div>
			</nav>
		);
	}
}

// @Radium
@Connect(state => ({
	currentPage: State(a => a.main.page),
}))
export class NavBarPageButton extends BaseComponent
		<{page?: string, text: string, panel?: boolean, active?: boolean, style?, onClick?: (e)=>void} & Partial<{currentPage: string}>,
		{hovered: boolean}> {
	render() {
		let { page, text, panel, active, style, onClick, currentPage } = this.props;
		// let {_radiumStyleState: {main: radiumState = {}} = {}} = this.state as any;
		// let {_radiumStyleState} = this.state as any;
		const { hovered } = this.state;
		active = active != null ? active : page == currentPage;

		const finalStyle = E(
			{
				position: 'relative', display: 'inline-block', cursor: 'pointer', verticalAlign: 'middle',
				lineHeight: '45px', color: '#FFF', padding: '0 15px', fontSize: 12, textDecoration: 'none', opacity: 0.9,
			},
			style,
		);

		const actions = [] as Action<any>[];
		if (page) {
			if (page != currentPage) {
				actions.push(new ACTSetPage(page));
			} else {
				// go to the page root-contents, if clicking on page in nav-bar we're already on
				actions.push(new ACTSetSubpage({ page, subpage: null }));
				if (page == 'database') {
					// if our default subpage is already active, then perform that subpage's action-if-already-active
					if ([null, 'users'].Contains(State(a => a.main.database.subpage))) {
						actions.push(new ACTUserSelect({ id: null }));
					}
				} else if (page == 'personal') {
					actions.push(new ACTPersonalMapSelect({ id: null }));
				} else if (page == 'debates') {
					actions.push(new ACTDebateMapSelect({ id: null }));
				}
			}
		}

		const hoverOrActive = hovered || active;
		return (
			<Link actions={actions} style={finalStyle} onMouseEnter={() => this.SetState({ hovered: true })} onMouseLeave={() => this.SetState({ hovered: false })} onClick={onClick}>
				{text}
				{hoverOrActive &&
					<div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgba(100,255,100,1)' }}/>}
			</Link>
		);
	}
}

type NavBarPanelButton_Props = {text: string, panel: string, corner: 'top-left' | 'top-right'} & Partial<{topLeftOpenPanel, topRightOpenPanel}>;
@Connect(_ => ({
	topLeftOpenPanel: State(a => a.main.topLeftOpenPanel),
	topRightOpenPanel: State(a => a.main.topRightOpenPanel),
}))
export class NavBarPanelButton extends BaseComponent<NavBarPanelButton_Props, {}> {
	render() {
		const { text, panel, corner, topLeftOpenPanel, topRightOpenPanel } = this.props;
		const active = (corner == 'top-left' ? topLeftOpenPanel : topRightOpenPanel) == panel;
		return (
			<NavBarPageButton page={panel} text={text} panel={true} active={active} onClick={(e) => {
				e.preventDefault();
				if (corner == 'top-left') { store.dispatch(new ACTTopLeftOpenPanelSet(active ? null : panel)); } else { store.dispatch(new ACTTopRightOpenPanelSet(active ? null : panel)); }
			}}/>
		);
	}
}
