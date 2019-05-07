import { BaseComponentWithConnector } from 'react-vextensions';
import { Connect } from 'Utils/FrameworkOverrides';
import { Map } from 'Store/firebase/maps/@Map';

const PlayingSubpanel_connector = (state, {}: {map: Map}) => ({
});
@Connect(PlayingSubpanel_connector)
export class PlayingSubpanel extends BaseComponentWithConnector(PlayingSubpanel_connector, {}) {
	render() {
		const { map } = this.props;
		return (
			<>
			</>
		);
	}
}
