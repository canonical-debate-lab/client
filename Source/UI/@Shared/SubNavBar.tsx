import { BaseComponent, BaseProps } from 'react-vextensions';
import { E } from 'js-vextensions';
import Radium from 'radium';
import {VURL} from "js-vextensions";
import {Link} from "../../Frame/ReactComponents/Link";
import { Connect } from '../../Frame/Database/FirebaseConnect';
import { ACTSetSubpage } from '../../Store/main';
import { rootPageDefaultChilds } from 'Frame/General/URLs';
import { State } from 'Frame/Store/StoreHelpers';
import { colors } from '../../Frame/UI/GlobalStyles';

export default class SubNavBar extends BaseComponent<{fullWidth?: boolean}, {}> {
	render() {
		const { fullWidth, children } = this.props;
		return (
			<nav className="clickThrough" style={{
				position: 'absolute', zIndex: 11, top: 0, width: '100%', textAlign: 'center',
				// background: "#000 url('/Images/Tiling/TopMenu.png') repeat-x scroll",
				// background: "rgba(0,0,0,.5)", boxShadow: "3px 3px 7px rgba(0,0,0,.07)",
			}}>
				<div style={E(
					{ display: 'inline-block', background: 'rgba(0,0,0,.7)', boxShadow: colors.navBarBoxShadow },
					fullWidth ? { width: '100%' } : { borderRadius: '0 0 10px 10px' },
				)}>
					{children}
				</div>
			</nav>
		);
	}
}

type SubNavBarButtonProps = {page: string, subpage: string, text: string} & Partial<{currentSubpage: string}>;
@Connect((state, {page})=> ({
	currentSubpage: State("main", page, "subpage") || rootPageDefaultChilds[page],
	}))
export class SubNavBarButton extends BaseComponent<SubNavBarButtonProps, {}> {
	render() {
		const { page, subpage, text, currentSubpage } = this.props;
		const active = subpage == currentSubpage;
		return (
			<Link text={text} to={`/${page}/${subpage}`} style={E(
				{
					display: 'inline-block', cursor: 'pointer', verticalAlign: 'middle',
					lineHeight: '30px', color: '#FFF', padding: '0 15px', fontSize: 12, textDecoration: 'none', opacity: 0.9,
					':hover': { color: 'rgba(100,255,100,1)' },
				},
				active && { color: 'rgba(100,255,100,1)' },
			)} onClick={(e) => {
				e.preventDefault();
				store.dispatch(new ACTSetSubpage({ page, subpage }));
			}}/>
		);
	}
}
