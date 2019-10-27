import { Switch } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { State } from 'Utils/FrameworkOverrides';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { GlobalListUI } from './Global/GlobalListUI';
import { GlobalMapUI } from './Global/GlobalMapUI';

export class GlobalUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const currentSubpage = State.Watch(a => a.main.global.subpage);
		const page = 'global';
		return (
			<>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="map" text="Map"/>
					{/* <SubNavBarButton page={page} subpage="list" text="List"/> */}
				</SubNavBar>
				<Switch>
					<GlobalMapUI/>
					{currentSubpage == 'list' && <GlobalListUI/>}
				</Switch>
			</>
		);
	}
}
