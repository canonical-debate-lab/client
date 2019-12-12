import { E } from 'js-vextensions';
import { BaseComponent, BaseComponentPlus } from 'react-vextensions';
import { rootPageDefaultChilds } from 'Utils/URL/URLs';
import { ActionFunc, Link, Observer } from 'vwebapp-framework';
import { store, RootState } from 'Store';
import { colors } from '../../Utils/UI/GlobalStyles';

// @Observer
export class SubNavBar extends BaseComponent<{fullWidth?: boolean}, {}> {
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

@Observer
export class SubNavBarButton extends BaseComponentPlus({} as {page: string, subpage: string, text: string, actionFuncIfAlreadyActive?: ActionFunc<RootState>}, {}) {
	render() {
		const { page, subpage, text, actionFuncIfAlreadyActive } = this.props;
		const currentSubpage = store.main[page].subpage || rootPageDefaultChilds[page];
		const active = subpage == currentSubpage;

		let actionFunc: ActionFunc<RootState>;
		if (!active) {
			actionFunc = (s) => s.main[page].subpage = subpage;
		} else if (actionFuncIfAlreadyActive) {
			actionFunc = actionFuncIfAlreadyActive;
		}

		return (
			<Link actionFunc={actionFunc} text={text} style={E(
				{
					display: 'inline-block', cursor: 'pointer', verticalAlign: 'middle',
					lineHeight: '30px', color: '#FFF', padding: '0 15px', fontSize: 12, textDecoration: 'none', opacity: 0.9,
					':hover': { color: 'rgba(100,255,100,1)' },
				},
				active && { color: 'rgba(100,255,100,1)' },
			)}/>
		);
	}
}
