import { Action, State, StoreAccessor } from 'Utils/FrameworkOverrides';

export class RatingUIState {
	smoothing = 5;
}
export class ACTRatingUISmoothnessSet extends Action<number> {}
export function RatingUIReducer(state = new RatingUIState(), action: Action<any>): RatingUIState {
	if (action.Is(ACTRatingUISmoothnessSet)) { return { ...state, smoothing: action.payload }; }
	return state;
}

// selectors
// ==========

export const GetRatingUISmoothing = StoreAccessor(() => {
	return State(a => a.main.ratingUI.smoothing);
});
