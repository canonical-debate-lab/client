import { GetPlayingTimeline, GetSelectedTimeline } from 'Store/main/mapStates/$mapState';
import { GetOpenMapID } from 'Store/main';
import { GetTimelineSteps } from 'Store/firebase/timelineSteps';
import { GetAsync, MergeDBUpdates } from 'mobx-firelink';
import { Clone, ToNumber } from 'js-vextensions';
import { NodeReveal } from 'Store/firebase/timelineSteps/@TimelineStep';

// temp (for in-console db-upgrades and such)
// ==========

/* export async function GetDBUpdatesFor_TimelineStepNodeRevealsAddShowProp() {
	const timeline = await GetAsync(() => GetSelectedTimeline(GetOpenMapID()));
	const steps = await GetAsync(() => GetTimelineSteps(timeline));
	const dbUpdateSets = steps.map((step) => {
		if (ToNumber(step.nodeReveals?.length, 0) == 0) return {};
		const newNodeReveals = step.nodeReveals.map((oldReveal) => {
			const newReveal = Clone(oldReveal) as NodeReveal;
			newReveal.show = true;
			return newReveal;
		});
		return {
			[`timelineSteps/${step._key}/.nodeReveals`]: newNodeReveals,
		};
	});
	let mergedDBUpdates = {};
	for (const updateSet of dbUpdateSets) {
		mergedDBUpdates = MergeDBUpdates(mergedDBUpdates, updateSet);
	}
	return mergedDBUpdates;
} */
