import { Switch } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import {store} from 'Store';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { GlobalListUI } from './Global/GlobalListUI';
import { GlobalMapUI } from './Global/GlobalMapUI';

export class GlobalUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const currentSubpage = store.main.global.subpage;
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
