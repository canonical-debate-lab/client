import { BaseComponentPlus } from 'react-vextensions';
import { GetMap } from 'Store/firebase/maps';
import { ListUI } from 'UI/@Shared/Maps/ListUI';
import { globalMapID } from '../../Store/firebase/nodes/@MapNode';

export class GlobalListUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const map = GetMap(globalMapID);
		if (map == null) return null;
		return (
			<ListUI map={map}/>
		);
	}
}
