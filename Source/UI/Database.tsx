import { Switch } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { store } from 'Store';
import {Observer} from 'vwebapp-framework';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { ImagesUI } from './Database/ImagesUI';
import { TermsUI } from './Database/TermsUI';
import { UsersUI } from './Database/Users';

@Observer
export class DatabaseUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const currentSubpage = store.main.database.subpage;
		const page = 'database';
		return (
			<>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="users" text="Users" actionFuncIfAlreadyActive={(s) => s.main.database.selectedUserID = null}/>
					<SubNavBarButton page={page} subpage="terms" text="Terms" /* actionIfAlreadyActive={() => new ACTTermSelect({ id: null })} *//>
					<SubNavBarButton page={page} subpage="images" text="Images" /* actionIfAlreadyActive={() => new ACTImageSelect({ id: null })} *//>
				</SubNavBar>
				<Switch>
					<UsersUI/>
					{currentSubpage == 'terms' && <TermsUI/>}
					{currentSubpage == 'images' && <ImagesUI/>}
				</Switch>
			</>
		);
	}
}
