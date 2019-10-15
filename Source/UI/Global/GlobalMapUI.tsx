import { BaseComponent } from 'react-vextensions';
import { Connect, PageContainer } from 'Utils/FrameworkOverrides';
import { globalMapID } from 'Store/firebase/nodes/@MapNode';
import { GetMap } from '../../Store/firebase/maps';
import { Map } from '../../Store/firebase/maps/@Map';
import { MapUI } from '../@Shared/Maps/MapUI';

type Props = {} & Partial<{map: Map}>;
@Connect(state => ({
	map: GetMap(globalMapID),
}))
export class GlobalMapUI extends BaseComponent<Props, {}> {
	render() {
		const { map } = this.props;
		return (
			<PageContainer fullWidth={true} fullHeight={true} style={{ margin: 0, padding: 0, background: null, filter: null }}>
				<MapUI map={map} subNavBarWidth={/* 104 */ 54}/>
			</PageContainer>
		);
	}
}
