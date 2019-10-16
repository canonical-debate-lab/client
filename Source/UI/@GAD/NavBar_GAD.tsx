import { DeepGet, E } from 'js-vextensions';
import { Button, Div, Row } from 'react-vcomponents';
import { BaseComponent, BaseComponentWithConnector } from 'react-vextensions';
import { ShowMessageBox } from 'react-vmessagebox';
import { ACTDebateMapSelect } from 'Store/main/debates';
import { ResetCurrentDBRoot } from 'UI/More/Admin/ResetCurrentDBRoot';
import { dbVersion } from 'Main';
import { Connect, State, Action, Link, GetData } from 'Utils/FrameworkOverrides';
import { ACTUserSelect } from 'Store/main/database';
import { ACTProposalSelect } from 'firebase-feedback';
import { NotificationsUI } from 'UI/@Shared/NavBar/NotificationsUI';
import { SearchPanel } from 'UI/@Shared/NavBar/SearchPanel';
import { UserPanel } from 'UI/@Shared/NavBar/UserPanel';
import { colors } from '../../Utils/UI/GlobalStyles';
import { ACTSetPage, ACTSetSubpage, ACTTopLeftOpenPanelSet, ACTTopRightOpenPanelSet } from '../../Store/main';
import { ACTPersonalMapSelect } from '../../Store/main/personal';

// main
// ==========

const connector = (state, {}: {}) => ({
	topLeftOpenPanel: State(a => a.main.topLeftOpenPanel),
	topRightOpenPanel: State(a => a.main.topRightOpenPanel),
	auth: State(a => a.firebase.auth),
	dbNeedsInit: GetData({ collection: true, useUndefinedForInProgress: true }, 'maps') === null, // use maps because it won't cause too much data to be downloaded-and-watched; improve this later
});
@Connect(connector)
export class NavBar_GAD extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { topLeftOpenPanel, topRightOpenPanel, auth, dbNeedsInit } = this.props;
		return (
			<nav style={{
				position: 'relative', zIndex: 11, height: 150, boxShadow: colors.navBarBoxShadow,
				// background: "#000 url('/Images/Tiling/TopMenu.png') repeat-x scroll",
				// background: 'rgba(0,0,0,1)',
			}}>
				<Row center style={{ height: '100%' }}>
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
					<Div ct style={{ position: 'fixed', left: 0, width: '30%', top: 150, bottom: 0 }}>
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

					<span style={{ margin: '0 auto', paddingRight: 5 }}>
						<NavBarPageButton page="website" text="Website"/>
						<NavBarPageButton page="home" text="Home"/>
						<NavBarPageButton page="debates" text="Debates"/>
					</span>

					<span style={{ position: 'absolute', right: 30, display: 'flex' }}>
						<NavBarPanelButton text="Search" panel="search" corner="top-right"/>
						<NavBarPanelButton text={DeepGet(auth, 'displayName') ? auth.displayName.match(/(.+?)( |$)/)[1] : 'Login'} panel="profile" corner="top-right"/>
					</span>
					<div style={{
						position: 'fixed', display: 'flex', zIndex: 11, right: 0, top: 150, maxHeight: 'calc(100% - 150px - 30px)',
						boxShadow: colors.navBarBoxShadow, clipPath: 'inset(0 0 -150px -150px)', // display: 'table',
					}}>
						{topRightOpenPanel == 'search' && <SearchPanel/>}
						{topRightOpenPanel == 'profile' && <UserPanel/>}
					</div>
				</Row>
			</nav>
		);
	}
}

// @Radium
@Connect(state => ({
	currentPage: State(a => a.main.page),
}))
class NavBarPageButton extends BaseComponent
		<{page?: string, text: string, panel?: boolean, active?: boolean, style?, onClick?: (e)=>void} & Partial<{currentPage: string}>,
		{hovered: boolean}> {
	render() {
		let { page, text, panel, active, style, onClick, currentPage } = this.props;
		// let {_radiumStyleState: {main: radiumState = {}} = {}} = this.state as any;
		// let {_radiumStyleState} = this.state as any;
		const { hovered } = this.state;
		active = active != null ? active : page == currentPage;

		const sideButton = ['search', 'profile'].Contains(page);
		let finalStyle = E(
			{
				position: 'relative', display: 'inline-block', cursor: 'pointer', verticalAlign: 'middle',
				// fontFamily: 'TypoPRO Bebas Neue',
				// fontFamily: 'Bebas Neue', // computer should have this font
				fontFamily: 'Cinzel',
				fontSize: sideButton ? 16 : 18, textTransform: sideButton ? 'uppercase' : null, fontWeight: 'normal',
				lineHeight: '150px', color: '#000', padding: '0 15px', textDecoration: 'none', opacity: 0.9,
			},
			style,
		);

		if (page == 'website') {
			return <Link to="https://greatamericandebate.org" style={finalStyle} onMouseEnter={() => this.SetState({ hovered: true })} onMouseLeave={() => this.SetState({ hovered: false })}>
				Website
				{hovered &&
					<div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgba(100,255,100,1)' }}/>}
			</Link>;
		}
		if (page == 'home') {
			text = null;
			finalStyle = E(finalStyle, { margin: '0 50px', width: 150, height: 150, backgroundImage: 'url(/Images/@GAD/Logo.png)', backgroundPosition: 'center center', backgroundSize: '100%', backgroundRepeat: 'no-repeat' });
		}

		const actions = [] as Action<any>[];
		if (page) {
			if (page != currentPage) {
				actions.push(new ACTSetPage(page));
			} else {
				// go to the page root-contents, if clicking on page in nav-bar we're already on
				actions.push(new ACTSetSubpage({ page, subpage: null }));
				if (page == 'debates') {
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
class NavBarPanelButton extends BaseComponent<NavBarPanelButton_Props, {}> {
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
