import { BaseComponent } from 'react-vextensions';
import { GetMap } from 'Store/firebase/maps';
import { ListUI } from 'UI/@Shared/Maps/ListUI';
import {Connect} from 'Utils/FrameworkOverrides';
import {Map} from "../../Store/firebase/maps/@Map";
import {globalMapID} from "../../Store/firebase/nodes/@MapNode";

type Props = {
} & Partial<{
	map: Map,
}>;
@Connect(state=> ({
	map: GetMap(globalMapID),
	}))
export class GlobalListUI extends BaseComponent<Props, {panelToShow}> {
	render() {
		const { map } = this.props;
		if (map == null) return null;
		return (
			<ListUI map={map}/>
		);
	}
}
