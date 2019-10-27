import { BaseComponentPlus } from 'react-vextensions';
import { globalMapID } from 'Store/firebase/nodes/@MapNode';
import { PageContainer } from 'Utils/FrameworkOverrides';
import { GetMap } from '../../Store/firebase/maps';
import { MapUI } from '../@Shared/Maps/MapUI';

export class GlobalMapUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const map = GetMap.Watch(globalMapID);
		return (
			<PageContainer fullWidth={true} fullHeight={true} style={{ margin: 0, padding: 0, background: null, filter: null }}>
				<MapUI map={map} subNavBarWidth={/* 104 */ 54}/>
			</PageContainer>
		);
	}
}
