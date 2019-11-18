import { BaseComponentPlus } from 'react-vextensions';
import { GetMap } from 'Store_Old/firebase/maps';
import { ListUI } from 'UI/@Shared/Maps/ListUI';
import { globalMapID } from '../../Store_Old/firebase/nodes/@MapNode';

export class GlobalListUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const map = GetMap.Watch(globalMapID);
		if (map == null) return null;
		return (
			<ListUI map={map}/>
		);
	}
}
