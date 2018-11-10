import { Column, Switch } from "react-vcomponents";
import { BaseComponentWithConnector } from "react-vextensions";
import { ScrollView } from "react-vscrollview";
import { Connect } from "../Frame/Database/FirebaseConnect";
import { IsUserAdmin } from "../Store/firebase/userExtras";
import { GetUserID, GetUserPermissionGroups, GetUsers } from "../Store/firebase/users";
import SubNavBar, { SubNavBarButton } from "./@Shared/SubNavBar";
import { AdminUI } from "./More/Admin";
import { LinksUI } from "./More/Links";

let connector = state=> ({
	_: GetUserPermissionGroups(GetUserID()), // just to make sure we've retrieved this data (and re-render when it changes)
	userCount: (GetUsers() || []).length,
	currentSubpage: State(a=>a.main.more.subpage),
});
@Connect(connector)
export class MoreUI extends BaseComponentWithConnector(connector, {}) {
	render() {
		let {userCount, currentSubpage, children} = this.props;
		let page = "more";
		let admin = IsUserAdmin(GetUserID());
		return (
			<Column style={ES({flex: 1})}>
				<SubNavBar>
					<SubNavBarButton {...{page}} subpage="links" text="Links"/>
					{/*<SubNavBarButton {...{page}} subpage="tasks" text="Tasks"/>*/}
					{admin && <SubNavBarButton {...{page}} subpage="admin" text="Admin"/>}
				</SubNavBar>
				<ScrollView style={ES({flex: 1} /*styles.fillParent_abs*/)} scrollVBarStyle={{width: 10}}>
					<Switch>
						<LinksUI/>
						{/*currentSubpage == "tasks" && <TasksUI/>*/}
						{currentSubpage == "admin" && <AdminUI/>}
					</Switch>
				</ScrollView>
			</Column>
		);
	}
}