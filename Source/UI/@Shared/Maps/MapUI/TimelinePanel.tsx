import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponentWithConnector } from 'react-vextensions';
import { MeID } from 'Store/firebase/users';
import { ACTMap_TimelineOpenSubpanelSet, GetSelectedTimeline, GetTimelineOpenSubpanel, TimelineSubpanel } from 'Store/main/maps/$map';
import { Connect } from 'Utils/FrameworkOverrides';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { IsUserCreatorOrMod } from '../../../../Store/firebase/userExtras';
import { CollectionSubpanel } from './TimelinePanel/CollectionSubpanel';
import { EditorSubpanel } from './TimelinePanel/EditorSubpanel';
import { PlayingSubpanel } from './TimelinePanel/PlayingSubpanel';

const connector = (state, { map }: {map: Map}) => {
	const timeline = GetSelectedTimeline(map._key);
	return {
		subpanel: GetTimelineOpenSubpanel(map._key),
	};
};
@Connect(connector)
export class TimelinePanel extends BaseComponentWithConnector(connector, {}) {
	render() {
		const { map, subpanel } = this.props;
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);
		return (
			<Row style={{ height: '100%', alignItems: 'flex-start' }}>
				<Column className="clickThrough" style={{ width: 600, height: '100%', background: 'rgba(0,0,0,.7)' /* borderRadius: "10px 10px 0 0" */}}>
					<Row>
						<Button text="Collection" style={{ flex: 1 }} onClick={() => store.dispatch(new ACTMap_TimelineOpenSubpanelSet({ mapID: map._key, subpanel: TimelineSubpanel.Collection }))}/>
						<Button text="Editor" style={{ flex: 1 }} onClick={() => store.dispatch(new ACTMap_TimelineOpenSubpanelSet({ mapID: map._key, subpanel: TimelineSubpanel.Editor }))}/>
						<Button text="Playing" style={{ flex: 1 }} onClick={() => store.dispatch(new ACTMap_TimelineOpenSubpanelSet({ mapID: map._key, subpanel: TimelineSubpanel.Playing }))}/>
					</Row>
					{subpanel == TimelineSubpanel.Collection && <CollectionSubpanel map={map}/>}
					{subpanel == TimelineSubpanel.Editor && <EditorSubpanel map={map}/>}
					{subpanel == TimelineSubpanel.Playing && <PlayingSubpanel map={map}/>}
				</Column>
			</Row>
		);
	}
}
