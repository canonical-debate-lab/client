import { Button, Column, DropDown, DropDownContent, DropDownTrigger, Pre, Row } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { ScrollView } from 'react-vscrollview';
import { DeleteTimeline } from 'Server/Commands/DeleteTimeline';
import { ACTMap_SelectedTimelineSet, GetSelectedTimeline, GetTimelineOpenSubpanel } from 'Store/main/maps/$map';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { ShowAddTimelineDialog } from 'UI/@Shared/Timelines/AddTimelineDialog';
import { ES } from 'Utils/UI/GlobalStyles';
import { Connect } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';
import { GetMapTimelines, GetTimelineSteps } from 'Store/firebase/timelines';
import { MeID } from 'Store/firebase/users';

const CollectionSubpanel_connector = (state, { map }: {map: Map}) => {
	const timeline = GetSelectedTimeline(map._key);
	return {
		timelines: GetMapTimelines(map),
		selectedTimeline: timeline,
		selectedTimelineSteps: timeline && GetTimelineSteps(timeline),
	};
};
@Connect(CollectionSubpanel_connector)
export class CollectionSubpanel extends BaseComponentWithConnector(CollectionSubpanel_connector, {}) {
	timelineSelect: DropDown;
	render() {
		const { map, timelines, selectedTimeline, selectedTimelineSteps } = this.props;
		return (
			<Row style={{ height: 40, padding: 10 }}>
				<DropDown ref={c => this.timelineSelect = c}>
					<DropDownTrigger><Button text={selectedTimeline ? selectedTimeline.name : '[none]'} /></DropDownTrigger>
					<DropDownContent style={{ left: 0, padding: null, background: null, borderRadius: null, zIndex: 1 }}>
						<Row style={{ alignItems: 'flex-start' }}>
							<Column style={{ width: 600 }}>
								<ScrollView style={ES({ flex: 1 })} contentStyle={{ flex: 0.8, position: 'relative', maxHeight: 500 }}>
									{timelines.map((timeline, index) => (
										<Column key={index} p="7px 10px"
											style={E(
												{
													cursor: 'pointer',
													background: index % 2 == 0 ? 'rgba(30,30,30,.7)' : 'rgba(0,0,0,.7)',
												},
												index == timelines.length - 1 && { borderRadius: '0 0 10px 10px' },
											)}
											onClick={() => {
												store.dispatch(new ACTMap_SelectedTimelineSet({ mapID: map._key, selectedTimeline: timeline._key }));
												this.timelineSelect.hide();
											}}>
											<Row>
												<Pre>{timeline.name} </Pre><span style={{ fontSize: 11 }}>(id: {timeline._key})</span>
											</Row>
										</Column>
									))}
								</ScrollView>
							</Column>
						</Row>
					</DropDownContent>
				</DropDown>
				<Button ml={5} text="X" title="Delete timeline" enabled={selectedTimeline != null && selectedTimeline.steps == null} onClick={() => {
					new DeleteTimeline({ timelineID: selectedTimeline._key }).Run();
				}} />
				<Button ml={5} text="+" title="Add new timeline" onClick={() => {
					if (MeID() == null) return ShowSignInPopup();
					ShowAddTimelineDialog(MeID(), map._key);
				}} />
				{/* <Button ml="auto" text="Play" title="Start playing this timeline" enabled={selectedTimeline != null} style={{ flexShrink: 0 }} onClick={() => {
					store.dispatch(new ACTMap_PlayingTimelineSet({ mapID: map._key, timelineID: selectedTimeline._key }));
					store.dispatch(new ACTMap_PlayingTimelineStepSet({ mapID: map._key, stepIndex: 0 }));
					store.dispatch(new ACTMap_PlayingTimelineAppliedStepSet({ mapID: map._key, stepIndex: null }));
				}}/> */}
			</Row>
		);
	}
}
