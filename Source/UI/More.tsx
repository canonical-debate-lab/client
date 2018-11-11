import { Column, Switch } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { HasAdminPermissions } from 'Store/firebase/userExtras';
import { Connect } from '../Frame/Database/FirebaseConnect';
import { GetUserID, GetUserPermissions, GetUsers } from '../Store/firebase/users';
import SubNavBar, { SubNavBarButton } from './@Shared/SubNavBar';
import { AdminUI } from './More/Admin';
import { LinksUI } from './More/Links';

const connector = state => ({
	_: GetUserPermissions(GetUserID()), // just to make sure we've retrieved this data (and re-render when it changes)
	userCount: (GetUsers() || []).length,
	currentSubpage: State(a => a.main.more.subpage),
});
@Connect(connector)
export class MoreUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { userCount, currentSubpage, children } = this.props;
		const page = 'more';
		const admin = HasAdminPermissions('me');
		return (
			<Column style={ES({ flex: 1 })}>
				<SubNavBar>
					<SubNavBarButton {...{ page }} subpage="links" text="Links"/>
					{/* <SubNavBarButton {...{page}} subpage="tasks" text="Tasks"/> */}
					{admin && <SubNavBarButton {...{ page }} subpage="admin" text="Admin"/>}
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
