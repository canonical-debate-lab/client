import { RootState } from 'Store';
import { LogTypes } from 'Utils/General/Logging';
import { CreateState, CreateACTSet, CreateSimpleReducer, CreateShouldLog, CreateMaybeLog } from '.';

export const State = CreateState<RootState>();
// State() actually also returns the root-state (if no data-getter is supplied), but we don't reveal that in type-info (as its only to be used in console)
G({ State });
export const ACTSet = CreateACTSet<RootState>();
export const SimpleReducer = CreateSimpleReducer<RootState>();
export const ShouldLog = CreateShouldLog<LogTypes>();
export const MaybeLog = CreateMaybeLog<LogTypes>();
