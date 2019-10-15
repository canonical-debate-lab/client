import { Column, Switch } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { State, Connect } from 'Utils/FrameworkOverrides';
import { ES } from 'Utils/UI/GlobalStyles';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';
import { AboutUI } from './Home/About';
import { HomeUI2 } from './Home/Home';

type Props = {} & Partial<{currentSubpage: string}>;
@Connect(state => ({
	currentSubpage: State(a => a.main.home.subpage),
}))
export class HomeUI extends BaseComponent<Props, {}> {
	render() {
		const { currentSubpage } = this.props;
		const page = 'home';
		return (
			<>
				<SubNavBar>
					<SubNavBarButton page={page} subpage='home' text='Home'/>
					<SubNavBarButton page={page} subpage='about' text='About'/>
				</SubNavBar>
				<Switch>
					<HomeUI2/>
					{currentSubpage === 'about' && <AboutUI/>}
				</Switch>
			</>
		);
	}
}
