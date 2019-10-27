import { Switch } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { State } from 'Utils/FrameworkOverrides';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { AboutUI } from './Home/About';
import { HomeUI2 } from './Home/Home';

export class HomeUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const currentSubpage = State.Watch(a => a.main.home.subpage);
		const page = 'home';
		return (
			<>
				<SubNavBar>
					<SubNavBarButton page={page} subpage='home' text='Home'/>
					<SubNavBarButton page={page} subpage='about' text='About'/>
				</SubNavBar>
				<Switch>
					<HomeUI2/>
					{currentSubpage === 'about' && <AboutUI/>}
				</Switch>
			</>
		);
	}
}
