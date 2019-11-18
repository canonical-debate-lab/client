import { Switch } from 'react-vcomponents';
import { BaseComponentPlus } from 'react-vextensions';
import { HasAdminPermissions } from 'Store_Old/firebase/userExtras';
import { State } from 'Utils/FrameworkOverrides';
import { GetUsers, MeID } from '../Store_Old/firebase/users';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { AdminUI } from './More/Admin';
import { LinksUI } from './More/Links';

export class MoreUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const admin = HasAdminPermissions.Watch(MeID.Watch());
		const userCount = (GetUsers.Watch() || []).length;
		const currentSubpage = State.Watch((a) => a.main.more.subpage);
		const page = 'more';
		return (
			<>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="links" text="Links"/>
					{/* <SubNavBarButton page={page} subpage="tasks" text="Tasks"/> */}
					{admin && <SubNavBarButton page={page} subpage="admin" text="Admin"/>}
				</SubNavBar>
				<Switch>
					<LinksUI/>
					{/* currentSubpage == "tasks" && <TasksUI/> */}
					{currentSubpage == 'admin' && <AdminUI/>}
				</Switch>
			</>
		);
	}
}
