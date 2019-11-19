import { ACTProposalSelect } from 'firebase-feedback';
import { Column, Switch } from 'react-vcomponents';
import { BaseComponent, BaseComponentPlus } from 'react-vextensions';
import { ProposalsUI } from 'UI/Feedback/ProposalsUI';
import { store } from 'Store';
import { SubNavBar, SubNavBarButton } from './@Shared/SubNavBar';

export class FeedbackUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const currentSubpage = store.main.feedback.subpage;
		const page = 'feedback';
		return (
			<Column style={{ flex: 1 }}>
				<SubNavBar>
					<SubNavBarButton page={page} subpage="proposals" text="Proposals" actionFuncIfAlreadyActive={(s) => s.feedback.selectedProposalID = null}/>
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
