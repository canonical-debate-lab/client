import { O } from 'vwebapp-framework/Source';
import { StoreAccessor } from 'mobx-firelink';

export class RatingUIState {
	@O smoothing = 5;
}

// selectors
// ==========

export const GetRatingUISmoothing = StoreAccessor((s) => () => {
	return s.main.ratingUI.smoothing;
});
