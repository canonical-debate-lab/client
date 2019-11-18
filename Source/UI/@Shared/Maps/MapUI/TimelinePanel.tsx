import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { MeID } from 'Store/firebase/users';
import { ACTMap_TimelineOpenSubpanelSet, GetSelectedTimeline, GetTimelineOpenSubpanel, TimelineSubpanel } from 'Store_Old/main/maps/$map';
import { Connect } from 'Utils/FrameworkOverrides';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { IsUserCreatorOrMod } from '../../../../Store/firebase/userExtras';
import { CollectionSubpanel } from './TimelinePanel/CollectionSubpanel';
import { EditorSubpanel } from './TimelinePanel/EditorSubpanel';
import { PlayingSubpanel } from './TimelinePanel/PlayingSubpanel';

export class TimelinePanel extends BaseComponentPlus({} as {map: Map}, {}) {
	render() {
		const { map } = this.props;
		const timeline = GetSelectedTimeline.Watch(map._key);
		const subpanel = GetTimelineOpenSubpanel.Watch(map._key);
		const creatorOrMod = IsUserCreatorOrMod.Watch(MeID.Watch(), map);

		return (
			<Row style={{ height: '100%', alignItems: 'flex-start' }}>
				<Column className="clickThrough" style={{ width: 600, height: '100%', background: 'rgba(0,0,0,.7)' /* borderRadius: "10px 10px 0 0" */ }}>
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
