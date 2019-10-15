import { Switch } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { Connect, Link, State } from 'Utils/FrameworkOverrides';
import { SubNavBarButton_GAD, SubNavBar_GAD } from './SubNavBar_GAD';
import { HomeUI2_GAD } from './Home2_GAD';

type Props = {} & Partial<{currentSubpage: string}>;
@Connect(state => ({
	currentSubpage: State(a => a.main.home.subpage),
}))
export class HomeUI_GAD extends BaseComponent<Props, {}> {
	render() {
		const { currentSubpage } = this.props;
		const page = 'home';
		const gad = startURL.GetQueryVar('extra') == 'gad';

		return (
			<>
				<SubNavBar_GAD>
					<SubNavBarButton_GAD page={page} subpage='home' text='Home'/>
					<SubNavBarButton_GAD page={page} subpage='about' text='About'/>
				</SubNavBar_GAD>
				<Switch>
					<HomeUI2_GAD/>
				</Switch>
			</>
		);
	}
}
