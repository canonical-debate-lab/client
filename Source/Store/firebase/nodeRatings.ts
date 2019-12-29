import { Lerp, emptyObj, ToJSON } from 'js-vextensions';
import { WeightingType } from 'Store/main';
import { GetDoc, StoreAccessor, GetDocs } from 'mobx-firelink';
import { GetArgumentImpactPseudoRatingSet } from '../../Utils/Store/RatingProcessor';
import { RatingType, ratingTypes } from './nodeRatings/@RatingType';
import { Rating, RatingsRoot } from './nodeRatings/@RatingsRoot';
import { RS_GetAllValues } from './nodeRatings/ReasonScore';
import { GetNodeChildrenL2, HolderType } from './nodes';
import { GetMainRatingType, GetNodeL2 } from './nodes/$node';
import { ClaimForm, MapNodeL3 } from './nodes/@MapNode';
import { MapNodeType } from './nodes/@MapNodeType';
import { MeID } from './users';

export const GetNodeRatingsRoot = StoreAccessor((s) => (nodeID: string) => {
	// RequestPaths(GetPaths_NodeRatingsRoot(nodeID));
	// return GetDoc({}, (a) => a.nodeRatings.get(nodeID));
	// maybe-temp workaround for GetData() not retrieving list of subcollections for doc-path
	const result = {} as RatingsRoot;
	for (const ratingType of ratingTypes) {
		const data = GetDocs({}, (a) => a.nodeRatings.get(nodeID).get(ratingType));
		if (data) {
			result[ratingType] = data;
		}
	}
	return result;
});

// path is needed if you want
export const GetRatingSet = StoreAccessor((s) => (nodeID: string, ratingType: RatingType) => {
	if (ratingType == 'impact') {
		const node = GetNodeL2(nodeID);
		if (node == null) return null;
		const nodeChildren = GetNodeChildrenL2(node);
		if (nodeChildren.Any((a) => a == null)) return emptyObj;
		const premises = nodeChildren.filter((a) => a == null || a.type == MapNodeType.Claim);
		return GetArgumentImpactPseudoRatingSet(node, premises);
	}
	const ratingsRoot = GetNodeRatingsRoot(nodeID);
	return ratingsRoot ? ratingsRoot[ratingType] : null;
});
// export function GetRatings(nodeID: string, ratingType: RatingType, thesisForm?: ThesisForm): Rating[] {
export const GetRatings = StoreAccessor((s) => (nodeID: string, ratingType: RatingType, filter?: RatingFilter): Rating[] => {
	/* let ratingSet = GetRatingSet(nodeID, ratingType, null);
	return CachedTransform("GetRatings", [nodeID, ratingType].concat((filter || {}).VValues()), {ratingSet},
		()=>ratingSet ? FilterRatings(ratingSet.VValues(true), filter) : []); */

	// return CachedTransform_WithStore('GetRatings', [nodeID, ratingType].concat((filter || {}).VValues()), {}, () => {
	const ratingSet = GetRatingSet(nodeID, ratingType);
	if (ratingSet == null) return [];
	return FilterRatings(ratingSet.VValues(true), filter);
	// });
});
export const GetRating = StoreAccessor((s) => (nodeID: string, ratingType: RatingType, userID: string) => {
	const ratingSet = GetRatingSet(nodeID, ratingType);
	if (ratingSet == null) return null;
	return ratingSet[userID];
});
export const GetRatingValue = StoreAccessor((s) => (nodeID: string, ratingType: RatingType, userID: string, resultIfNoData = null): number => {
	const rating = GetRating(nodeID, ratingType, userID);
	return rating ? rating.value : resultIfNoData;
});
export const GetRatingAverage = StoreAccessor((s) => (nodeID: string, ratingType: RatingType, filter?: RatingFilter): number => {
	// return CachedTransform_WithStore('GetRatingAverage', [nodeID, ratingType, resultIfNoData].concat((filter || {}).VValues()), {}, () => {
	// if voting disabled, always show full bar
	/* let node = GetNodeL2(nodeID);
	if (node && node.current.votingDisabled) return 100;

	let ratings = GetRatings(nodeID, ratingType, filter);
	if (ratings.length == 0) return resultIfNoData as any; */

	const node = GetNodeL2(nodeID);
	if (node && node.current.votingDisabled) return 100;

	const ratings = GetRatings(nodeID, ratingType, filter);
	if (ratings.length == 0) return null;
	return ratings.map((a) => a.value).Average().RoundTo(1);
});
export const GetRatingAverage_AtPath = StoreAccessor((s) => (node: MapNodeL3, ratingType: RatingType, filter?: RatingFilter, resultIfNoData = null): number => {
	let result = GetRatingAverage(node._key, ratingType, filter);
	if (result == null) return resultIfNoData;
	if (ShouldRatingTypeBeReversed(node, ratingType)) {
		result = 100 - result;
	}
	return result;
});

const rsCompatibleNodeTypes = [MapNodeType.Argument, MapNodeType.Claim];
// export const GetFillPercent_AtPath = StoreAccessor('GetFillPercent_AtPath', (node: MapNodeL3, path: string, boxType?: HolderType, ratingType?: RatingType, filter?: RatingFilter, resultIfNoData = null) => {
export const GetFillPercent_AtPath = StoreAccessor((s) => (node: MapNodeL3, path: string, boxType?: HolderType, ratingType?: RatingType, filter?: RatingFilter, resultIfNoData = null) => {
	ratingType = ratingType || { [HolderType.Truth]: 'truth', [HolderType.Relevance]: 'relevance' }[boxType] as any || GetMainRatingType(node);
	if (s.main.maps.weighting == WeightingType.Votes || !rsCompatibleNodeTypes.Contains(node.type)) {
		return GetRatingAverage_AtPath(node, ratingType, filter, resultIfNoData);
	}

	const { argTruthScoreComposite, argWeightMultiplier, claimTruthScore } = RS_GetAllValues(node._key, path);

	// if (State(a=>a.main.weighting) == WeightingType.ReasonScore) {
	let result: number;
	if (node.type == MapNodeType.Claim) {
		result = claimTruthScore * 100;
	} else if (node.type == MapNodeType.Argument) {
		if (boxType == HolderType.Relevance) {
			// return Lerp(0, 100, GetPercentFromXToY(0, 2, argWeightMultiplier));
			result = Lerp(0, 100, argWeightMultiplier);
		} else {
			result = argTruthScoreComposite * 100;
		}
	}

	// if result not in-range, the data must still be loading, so just return 0
	/* if (!(result >= 0 && result <= 100)) {
		result = 0;
	} */

	return result;
});

export const GetMarkerPercent_AtPath = StoreAccessor((s) => (node: MapNodeL3, path: string, boxType?: HolderType, ratingType?: RatingType) => {
	ratingType = ratingType || { [HolderType.Truth]: 'truth', [HolderType.Relevance]: 'relevance' }[boxType] as any || GetMainRatingType(node);
	if (s.main.maps.weighting == WeightingType.Votes || !rsCompatibleNodeTypes.Contains(node.type)) {
		return GetRatingAverage_AtPath(node, ratingType, new RatingFilter({ includeUser: MeID() }));
	}
});

/* export function GetPaths_MainRatingSet(node: MapNode) {
	let mainRatingType = MapNode.GetMainRatingTypes(node)[0];
	return [`nodeRatings/${node._id}/${mainRatingType}`];
}
export function GetPaths_MainRatingAverage(node: MapNode) {
	let result = GetPaths_MainRatingSet(node);
	if (node.type == MapNodeType.Argument || node.type == MapNodeType.Argument)
		result.AddRange(GetPaths_CalculateArgumentStrength(node, GetNodeChildren(node)));
	return result;
} */

/** Returns an int from 0 to 100. */
/* export function GetMainRatingAverage(node: MapNode, resultIfNoData = null): number {
	// if static category, always show full bar
	if (node._id < 100)
		return 100;
	return GetRatingAverage(node._id, MapNode.GetMainRatingTypes(node)[0], resultIfNoData);
} */

/** Returns an int from 0 to 100. */
/* export function GetMainRatingFillPercent(node: MapNode) {
	let mainRatingAverage = GetMainRatingAverage(node);
	if (node.current.impactPremise && (node.current.impactPremise.thenType == ImpactPremise_ThenType.StrengthenParent || node.current.impactPremise.thenType == ImpactPremise_ThenType.WeakenParent))
		return mainRatingAverage != null ? mainRatingAverage.Distance(50) * 2 : 0;
	return mainRatingAverage || 0;
} */

/* export function GetFillPercentForRatingAverage(node: MapNode, ratingAverage: number, reverseRating?: boolean) {
	ratingAverage = TransformRatingForContext(ratingAverage, reverseRating);
	/*if (node.current.impactPremise && (node.current.impactPremise.thenType == ImpactPremise_ThenType.StrengthenParent || node.current.impactPremise.thenType == ImpactPremise_ThenType.WeakenParent))
		return ratingAverage != null ? ratingAverage.Distance(50) * 2 : 0;*#/
	return ratingAverage || 0;
}
export function TransformRatingForContext(ratingValue: number, reverseRating: boolean) {
	if (ratingValue == null) return null;
	if (reverseRating) return 100 - ratingValue;
	return ratingValue;
} */

export class RatingFilter {
	constructor(initialData: Partial<RatingFilter>) {
		this.VSet(initialData);
	}

	includeUser = null as string;
}
export function FilterRatings(ratings: Rating[], filter: RatingFilter) {
	return ratings.filter((a) => filter == null || filter.includeUser == a._key);
}

export function TransformRatingForContext(ratingValue: number, reverseRating: boolean) {
	if (ratingValue == null) return null;
	if (reverseRating) return 100 - ratingValue;
	return ratingValue;
}
/* export function GetFillPercentForRatingType(node: MapNodeL3, path: string, ratingType: RatingType, filter?: RatingFilter) {
	if (ratingType == "impact") {
		let nodeChildren = GetNodeChildrenL3(node, path);
		//let nodeChildren = GetNodeChildrenL2(node).map(child=>AsNodeL3(child, Polarity.Supporting, GetLinkUnderParent(child._id, node)));
		if (nodeChildren.Any(a=>a == null)) return 0;
		let premises = nodeChildren.filter(a=>a.type == MapNodeType.Claim);
		let averageTruth = premises.map(premise=>GetRatingAverage_AtPath(premise, "truth", filter, null)).Average();
		//Log(`Node: ${node._id} @averageTruth: ${averageTruth}`);

		let averageRelevance = GetRatingAverage(node._id, "relevance", filter);

		return ((averageTruth / 100) * (averageRelevance / 100)) * 100;
	}

	return GetRatingAverage_AtPath(node, ratingType, filter) || 0;
} */

/* export function ShouldRatingTypeBeReversed(ratingType: RatingType, nodeReversed: boolean, contextReversed: boolean) {
	//return nodeReversed || (contextReversed && ratingType == "adjustment");
	return nodeReversed;
} */
export function ShouldRatingTypeBeReversed(node: MapNodeL3, ratingType: RatingType) {
	// return node.type == MapNodeType.Argument && node.finalPolarity != node.link.polarity;
	// if (["impact", "relevance"].Contains(ratingType)) return false;
	return node.link.form == ClaimForm.Negation;
}
