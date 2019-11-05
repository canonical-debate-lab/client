import { RootState } from 'Store';
import { Clone } from 'js-vextensions';

export const migrations = {
	// migrator to v1
	1: (state) => {
		const newState = Clone(state) as RootState;
		for (const map of newState.main.maps.VValues(true)) {
			delete map['playingTimeline'];
		}
		return newState;
	},
};
