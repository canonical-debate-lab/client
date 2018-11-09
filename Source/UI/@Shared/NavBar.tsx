import { DeepGet, E } from "js-vextensions";
import { BaseComponent, BaseComponentWithConnector } from "react-vextensions";
import { State } from "Store";
import { GetData } from "Utils/Database/DatabaseHelpers";
import { Link } from "Utils/UI/Components/Link";
import { GetCurrentURL } from "Utils/URL/URLManager";
import { Connect } from "../../Utils/Database/FirebaseConnect";
import UserPanel from "./NavBar/UserPanel";
import { colors } from "Utils/UI/General";

// main
// ==========

const originSettings = {horizontal: "right", vertical: "top"};
const buttonStyle = {color: "white", textDecoration: "none"};
const avatarSize = 50;

const avatarStyles = {
	icon: {width: avatarSize, height: avatarSize},
	button: {marginRight: "1.5rem", width: avatarSize, height: avatarSize},
	wrapper: {marginTop: 45 - avatarSize}
};

let connector = (state, {}: {})=> ({
	auth: State(a=>a.firebase.auth),
	_: GetData({useUndefinedForInProgress: true}, "maps"),
	dbNeedsInit: GetData({useUndefinedForInProgress: true}, "maps") === null,
});
@Connect(connector)
export class NavBar extends BaseComponentWithConnector(connector, {topLeftOpenPanel: null, topRightOpenPanel: null}) {
	render() {
		let {auth, dbNeedsInit} = this.props;
		let {topLeftOpenPanel, topRightOpenPanel} = this.state;
		return (
			<nav style={{
				position: "relative", zIndex: 11, padding: "0 10px", boxShadow: colors.navBarBoxShadow,
				//background: "#000 url('/Images/Tiling/TopMenu.png') repeat-x scroll",
				background: "rgba(0,0,0,1)",
			}}>
				<div style={{display: "flex"}}>
					<div style={{position: "absolute", zIndex: 11, left: 0, top: 45,
							boxShadow: colors.navBarBoxShadow, clipPath: "inset(0 -150px -150px 0)", display: "table"}}>
					</div>
					
					<span style={{margin: "0 auto", paddingRight: 6}}>
						<NavBarButton page="home" text="Canonical Debate" style={{margin: "0 auto", textAlign: "center", fontSize: 23}}/>
						<NavBarButton page="gad" text="GAD"/>
					</span>

					<span style={{position: "absolute", right: 0, display: "flex"}}>
						<NavBarPanelButton text={DeepGet(auth, "displayName") ? auth.displayName.match(/(.+?)( |$)/)[1] : `Sign in`}
							panel="profile" openPanel={topRightOpenPanel} setOpenPanel={panel=>this.SetState({topRightOpenPanel: panel})}/>
					</span>
					<div style={{position: "absolute", zIndex: 11, right: 0, top: 45,
							boxShadow: colors.navBarBoxShadow, clipPath: "inset(0 0 -150px -150px)", display: "table"}}>
						{topRightOpenPanel == "profile" && <UserPanel/>}
					</div>
				</div>
			</nav>
		);
	}
}

@Connect(state=> ({
	currentPage: State(a=>a.main.page),
}))
export class NavBarButton extends BaseComponent
		<{page?: string, text: string, panel?: boolean, active?: boolean, style?, onClick?: (e)=>void} & Partial<{currentPage: string}>,
		{hovered: boolean}> {
	render() {
		var {page, text, panel, active, style, onClick, currentPage} = this.props;
		let {hovered} = this.state;
		active = active != null ? active : page == currentPage;

		let finalStyle = E(
			{
				position: "relative", display: "inline-block", cursor: "pointer", verticalAlign: "middle",
				lineHeight: "45px", color: "#FFF", padding: "0 15px", fontSize: 12, textDecoration: "none", opacity: .9,
			},
			style,
		);

		let to: string;
		if (page) {
			if (page != currentPage) {
				//actions = [new ACTSetPage(page)];
				to = GetCurrentURL().VSet({pathNodes: []}).toString() + "/" + page;
			}
		}
		
		let hoverOrActive = hovered || active;
		return (
			<Link to={to}style={finalStyle} onMouseEnter={()=>this.SetState({hovered: true})} onMouseLeave={()=>this.SetState({hovered: false})} onClick={onClick}>
				{text}
				{hoverOrActive &&
					<div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: `rgba(100,255,100,1)`}}/>}
			</Link>
		);
	}
}

type PanelType = "profile";

type NavBarPanelButton_Props = {text: string, panel: PanelType, openPanel: PanelType, setOpenPanel: (panel: PanelType)=>any};
export class NavBarPanelButton extends BaseComponent<NavBarPanelButton_Props, {}> {
	render() {
		let {text, panel, openPanel, setOpenPanel} = this.props;
		let active = openPanel == panel;
		return (
			<NavBarButton page={panel} text={text} panel={true} active={active} onClick={e=> {
				e.preventDefault();
				setOpenPanel(active ? null : panel);
			}}/>
		);
	}
}