import { Column, Switch } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { HasAdminPermissions } from 'Store/firebase/userExtras';
import { Connect, State } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { MeID, GetUserPermissionGroups, GetUsers } from '../Store/firebase/users';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { AdminUI } from './More/Admin';
import { LinksUI } from './More/Links';

const connector = state => ({
	_: GetUserPermissionGroups(MeID()), // just to make sure we've retrieved this data (and re-render when it changes)
	userCount: (GetUsers() || []).length,
	currentSubpage: State(a => a.main.more.subpage),
});
@Connect(connector)
export class MoreUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { userCount, currentSubpage, children } = this.props;
		const page = 'more';
		const admin = HasAdminPermissions(MeID());
		return (
			<Column style={ES({ flex: 1 })}>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="links" text="Links"/>
					{/* <SubNavBarButton page={page} subpage="tasks" text="Tasks"/> */}
					{admin && <SubNavBarButton page={page} subpage="admin" text="Admin"/>}
				</SubNavBar>
				<ScrollView style={ES({ flex: 1 } /* styles.fillParent_abs */)} scrollVBarStyle={{ width: 10 }}>
					<Switch>
						<LinksUI/>
						{/* currentSubpage == "tasks" && <TasksUI/> */}
						{currentSubpage == 'admin' && <AdminUI/>}
					</Switch>
				</ScrollView>
			</Column>
		);
	}
}
