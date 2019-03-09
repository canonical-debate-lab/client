import u from 'updeep';
import { RootState } from 'Store';
import { Assert } from 'js-vextensions';

export const State_overrides = {
	state: null as RootState,
	countAsAccess: null,
};

export class State_Options {
	state?: RootState;
	countAsAccess?: boolean;
}

export function StartStateDataOverride(tempData: any) {
	Assert(State_overrides.state == null, 'Cannot start a state-data-override when one is already active.');
	State_overrides.state = tempData;
}
export function UpdateStateDataOverride(updates) {
	Assert(State_overrides.state != null, 'Cannot update a state-data-override when none has been activated yet.');
	for (const { key: path, value } of updates.Pairs()) {
		State_overrides.state = u.updateIn(path.replace(/\//g, '.'), u.constant(value), State_overrides.state);
	}
}
export function StopStateDataOverride() {
	Assert(State_overrides.state != null, 'Cannot stop a state-data-override when none has been activated yet.');
	State_overrides.state = null;
}
