import { BaseComponent } from 'react-vextensions';
import {Connect} from 'Utils/FrameworkOverrides';
import {GetMap} from '../../Store/firebase/maps';
import {Map} from '../../Store/firebase/maps/@Map';
import {MapUI} from '../@Shared/Maps/MapUI';
import {globalMapID} from 'Store/firebase/nodes/@MapNode';

type Props = {} & Partial<{map: Map}>;
@Connect(state=> ({
	map: GetMap(globalMapID),
}))
export class GlobalMapUI extends BaseComponent<Props, {}> {
	render() {
		const { map } = this.props;
		return (
			<MapUI map={map} subNavBarWidth={/* 104 */ 54}/>
		);
	}
}
