import { BaseComponent, BaseProps } from 'react-vextensions';
import { firebaseConnect } from 'react-redux-firebase';
import { ScrollView } from 'react-vscrollview';
import { Column } from 'react-vcomponents';
import { Switch } from 'react-vcomponents';
import { State } from 'Frame/Store/StoreHelpers';
import SubNavBar from './@Shared/SubNavBar';
import { SubNavBarButton } from './@Shared/SubNavBar';
import { GlobalMapUI } from './Global/GlobalMapUI';
import { GlobalListUI } from './Global/GlobalListUI';
import { Connect } from '../Frame/Database/FirebaseConnect';

type Props = {} & Partial<{currentSubpage: string}>;
@Connect(state=> ({
	currentSubpage: State(a=>a.main.global.subpage),
	}))
export class GlobalUI extends BaseComponent<Props, {}> {
	render() {
		const { currentSubpage } = this.props;
		const page = 'global';
		return (
			<Column style={ES({ flex: 1 })}>
				<SubNavBar>
					<SubNavBarButton {...{ page }} subpage="map" text="Map"/>
					{/* <SubNavBarButton {...{page}} subpage="list" text="List"/> */}
				</SubNavBar>
				<Switch>
					<GlobalMapUI/>
					{currentSubpage == 'list' && <GlobalListUI/>}
				</Switch>
			</Column>
		);
	}
}
