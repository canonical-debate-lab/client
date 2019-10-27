import { Switch } from 'react-vcomponents';
import { BaseComponent, BaseComponentPlus } from 'react-vextensions';
import { Connect, State } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { ACTUserSelect, ACTTermSelect, ACTImageSelect } from 'Store/main/database';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { ImagesUI } from './Database/ImagesUI';
import { TermsUI } from './Database/TermsUI';
import { UsersUI } from './Database/Users';

export class DatabaseUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const currentSubpage = State.Watch(a => a.main.database.subpage);
		const page = 'database';
		return (
			<>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="users" text="Users" actionIfAlreadyActive={() => new ACTUserSelect({ id: null })}/>
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
