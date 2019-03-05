import { BaseComponent, BaseProps } from 'react-vextensions';
import { Column } from 'react-vcomponents';
import { Switch } from 'react-vcomponents';
import { State, Connect } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { SubNavBar } from './@Shared/SubNavBar';
import { SubNavBarButton } from './@Shared/SubNavBar';
import { GlobalMapUI } from './Global/GlobalMapUI';
import { GlobalListUI } from './Global/GlobalListUI';

type Props = {} & Partial<{currentSubpage: string}>;
@Connect(state => ({
	currentSubpage: State(a => a.main.global.subpage),
}))
export class GlobalUI extends BaseComponent<Props, {}> {
	render() {
		const { currentSubpage } = this.props;
		const page = 'global';
		return (
			<Column style={ES({ flex: 1 })}>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="map" text="Map"/>
					{/* <SubNavBarButton page={page} subpage="list" text="List"/> */}
				</SubNavBar>
				<Switch>
					<GlobalMapUI/>
					{currentSubpage == 'list' && <GlobalListUI/>}
				</Switch>
			</Column>
		);
	}
}
