import { ACTProposalSelect } from 'firebase-feedback';
import { Column, Switch } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { ProposalsUI } from 'UI/Feedback/ProposalsUI';
import { Connect, State } from 'Utils/FrameworkOverrides';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';

type Props = {} & Partial<{currentSubpage: string}>;
@Connect(state => ({
	currentSubpage: State(a => a.main.feedback.subpage),
}))
export class FeedbackUI extends BaseComponent<Props, {}> {
	render() {
		const { currentSubpage } = this.props;
		const page = 'feedback';
		return (
			<Column style={{ flex: 1 }}>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="proposals" text="Proposals" actionIfAlreadyActive={() => new ACTProposalSelect({ id: null }) as any}/>
					{/* <SubNavBarButton page={page} subpage="roadmap" text="Roadmap"/>
					<SubNavBarButton page={page} subpage="neutrality" text="Neutrality"/> */}
				</SubNavBar>
				<Switch>
					<ProposalsUI/>
					{/* currentSubpage == "roadmap" && <RoadmapUI/>}
					{currentSubpage == "neutrality" && <NeutralityUI/> */}
				</Switch>
			</Column>
		);
	}
}
