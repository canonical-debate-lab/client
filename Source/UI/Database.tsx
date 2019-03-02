import { Switch } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import {Connect, State} from 'Utils/FrameworkOverrides';
import SubNavBar, { SubNavBarButton } from './@Shared/SubNavBar';
import ImagesUI from './Content/ImagesUI';
import { TermsUI } from './Content/TermsUI';
import UsersUI from './Users';

type Props = {} & Partial<{currentSubpage: string}>;
@Connect(state=> ({
	currentSubpage: State(a=>a.main.database.subpage),
	}))
export class DatabaseUI extends BaseComponent<Props, {}> {
	render() {
		const { currentSubpage } = this.props;
		const page = 'database';
		return (
			<div style={ES({ flex: 1, display: 'flex', flexDirection: 'column' })}>
				<SubNavBar>
					<SubNavBarButton {...{ page }} subpage="users" text="Users"/>
					<SubNavBarButton {...{ page }} subpage="terms" text="Terms"/>
					<SubNavBarButton {...{ page }} subpage="images" text="Images"/>
				</SubNavBar>
				<Switch>
					<UsersUI/>
					{currentSubpage == 'terms' && <TermsUI/>}
					{currentSubpage == 'images' && <ImagesUI/>}
				</Switch>
			</div>
		);
	}
}
