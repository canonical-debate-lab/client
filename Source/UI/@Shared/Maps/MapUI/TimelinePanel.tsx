import { Button, Column, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { MeID } from 'Store/firebase/users';
import { store } from 'Store';
import {GetSelectedTimeline, GetTimelineOpenSubpanel, TimelineSubpanel} from 'Store/main/maps/$map';
import { Map } from '../../../../Store/firebase/maps/@Map';
import { IsUserCreatorOrMod } from '../../../../Store/firebase/userExtras';
import { CollectionSubpanel } from './TimelinePanel/CollectionSubpanel';
import { EditorSubpanel } from './TimelinePanel/EditorSubpanel';
import { PlayingSubpanel } from './TimelinePanel/PlayingSubpanel';

export class TimelinePanel extends BaseComponentPlus({} as {map: Map}, {}) {
	render() {
		const { map } = this.props;
		const timeline = GetSelectedTimeline(map._key);
		const subpanel = GetTimelineOpenSubpanel(map._key);
		const creatorOrMod = IsUserCreatorOrMod(MeID(), map);

		const mapInfo = store.main.maps.get(map._key);
		return (
			<Row style={{ height: '100%', alignItems: 'flex-start' }}>
				<Column className="clickThrough" style={{ width: 600, height: '100%', background: 'rgba(0,0,0,.7)' /* borderRadius: "10px 10px 0 0" */ }}>
					<Row>
						<Button text="Collection" style={{ flex: 1 }} onClick={() => mapInfo.timelineOpenSubpanel = TimelineSubpanel.Collection}/>
						<Button text="Editor" style={{ flex: 1 }} onClick={() => mapInfo.timelineOpenSubpanel = TimelineSubpanel.Editor}/>
						<Button text="Playing" style={{ flex: 1 }} onClick={() => mapInfo.timelineOpenSubpanel = TimelineSubpanel.Playing}/>
					</Row>
					{subpanel == TimelineSubpanel.Collection && <CollectionSubpanel map={map}/>}
					{subpanel == TimelineSubpanel.Editor && <EditorSubpanel map={map}/>}
					{subpanel == TimelineSubpanel.Playing && <PlayingSubpanel map={map}/>}
				</Column>
			</Row>
		);
	}
}
