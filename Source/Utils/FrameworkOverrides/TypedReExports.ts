import { RootState } from 'Store';
import { CreateState, CreateACTSet, CreateSimpleReducer, CreateShouldLog, CreateMaybeLog, LogTypes_Base } from '.';

export class LogTypes extends LogTypes_Base {
	actions = false;
	nodeRenders = false;
	nodeRenders_for = null as string;
	nodeRenderDetails = false;
	nodeRenderDetails_for = null as string;

	// doesn't actually log; rather, causes data to be stored in component.props.extraInfo.renderTriggers
	renderTriggers = false;
}

export const State = CreateState<RootState>();
// State() actually also returns the root-state (if no data-getter is supplied), but we don't reveal that in type-info (as its only to be used in console)
G({ State });
export const ACTSet = CreateACTSet<RootState>();
export const SimpleReducer = CreateSimpleReducer<RootState>();
export const ShouldLog = CreateShouldLog<LogTypes>();
export const MaybeLog = CreateMaybeLog<LogTypes>();
