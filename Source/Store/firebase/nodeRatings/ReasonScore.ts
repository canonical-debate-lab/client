import { GetNodeChildrenL3 } from 'Store/firebase/nodes';
import { MapNodeL3 } from 'Store/firebase/nodes/@MapNode';
import { ArgumentType } from 'Store/firebase/nodes/@MapNodeRevision';
import { emptyArray_forLoading } from 'js-vextensions';
import { GetParentNodeL3 } from '../nodes';
import { Polarity } from '../nodes/@MapNode';
import { MapNodeType } from '../nodes/@MapNodeType';

export function RS_CalculateTruthScore(claim: MapNodeL3, calculationPath = [] as number[]) {
	Assert(claim && claim.type == MapNodeType.Claim, 'RS truth-score can only be calculated for a claim.');

	// if we've hit a cycle back to a claim we've already started calculating for (the root claim), consider the truth-score at this lower-location to be 100%
	if (calculationPath.length && calculationPath.indexOf(calculationPath.Last()) < calculationPath.length - 1) return 1;

	const childArguments = GetChildArguments(claim);
	if (childArguments == null || childArguments.length == 0) return 1;

	let runningAverage;
	let weightTotalSoFar = 0;
	for (const argument of childArguments) {
		const premises = GetNodeChildrenL3(argument).filter(a => a && a.type == MapNodeType.Claim);
		if (premises.length == 0) continue;

		let truthScoreComposite = RS_CalculateTruthScoreComposite(argument, calculationPath.concat(argument._id));
		const weight = RS_CalculateWeight(argument, premises, calculationPath.concat(argument._id));
		if (weight == 0) continue; // if 0 weight, this argument won't change the result at all, so skip it

		if (argument.finalPolarity == Polarity.Opposing) {
			truthScoreComposite = 1 - truthScoreComposite;
		}

		if (runningAverage == null) {
			weightTotalSoFar = weight;
			runningAverage = truthScoreComposite;
		} else {
			weightTotalSoFar += weight; // increase weight first
			const deviationFromAverage = truthScoreComposite - runningAverage;
			const weightRelativeToTotal = weight / weightTotalSoFar;
			runningAverage += deviationFromAverage * weightRelativeToTotal;
		}
		Assert(!IsNaN(runningAverage), 'Got an NaN in truth-score calculation function.');
	}
	return runningAverage || 0;
}
export function RS_CalculateTruthScoreComposite(argument: MapNodeL3, calculationPath = [] as number[]) {
	Assert(argument && argument.type == MapNodeType.Argument, 'RS truth-score-composite can only be calculated for an argument.');

	const premises = GetNodeChildrenL3(argument).filter(a => a && a.type == MapNodeType.Claim);
	if (premises.length == 0) return 0;

	const truthScores = premises.map(premise => RS_CalculateTruthScore(premise, calculationPath.concat(premise._id)));
	const truthScoreComposite = CombinePremiseTruthScores(truthScores, argument.current.argumentType);
	return truthScoreComposite;
}

export function RS_CalculateBaseWeight(claim: MapNodeL3, calculationPath = [] as number[]) {
	const truthScore = RS_CalculateTruthScore(claim, calculationPath);
	// if truth-score drops below 50, it has 0 weight
	if (truthScore <= 0.5) return 0;

	const weight = (truthScore - 0.5) / 0.5;
	return weight;
}
export function RS_CalculateWeightMultiplier(node: MapNodeL3, calculationPath = [] as number[]) {
	Assert(node && node.type == MapNodeType.Argument, 'RS weight-multiplier can only be calculated for an argument<>claim combo -- which is specified by providing its argument node.');

	const childArguments = GetChildArguments(node);
	if (childArguments == null || childArguments.length == 0) return 1;

	let runningMultiplier = 1;
	let runningDivisor = 1;
	for (const argument of childArguments) {
		const premises = GetNodeChildrenL3(argument).filter(a => a && a.type == MapNodeType.Claim);
		if (premises.length == 0) continue;

		const truthScores = premises.map(premise => RS_CalculateTruthScore(premise, calculationPath.concat(premise._id)));
		const truthScoresCombined = CombinePremiseTruthScores(truthScores, argument.current.argumentType);
		const weight = RS_CalculateWeight(argument, premises, calculationPath.concat(argument._id));

		if (argument.finalPolarity == Polarity.Supporting) {
			runningMultiplier += truthScoresCombined * weight;
		} else {
			runningDivisor += truthScoresCombined * weight;
		}
	}
	return runningMultiplier / runningDivisor;
}
export function RS_CalculateWeight(argument: MapNodeL3, premises: MapNodeL3[], calculationPath = [] as number[]) {
	if (premises.length == 0) return 0;
	const baseWeightsProduct = premises.map(premise => RS_CalculateBaseWeight(premise, calculationPath.concat(premise._id))).reduce((prev, cur) => prev * cur);
	const weightMultiplier = RS_CalculateWeightMultiplier(argument, calculationPath);
	return baseWeightsProduct * weightMultiplier;
}

export type ReasonScoreValues = {argument, premises, argTruthScoreComposite, argWeightMultiplier, argWeight, claimTruthScore, claimBaseWeight};
export type ReasonScoreValues_RSPrefix = {argument, premises, rs_argTruthScoreComposite, rs_argWeightMultiplier, rs_argWeight, rs_claimTruthScore, rs_claimBaseWeight};
export function RS_GetAllValues(node: MapNodeL3, path: string, useRSPrefix = false, calculationPath = [] as number[]): ReasonScoreValues & ReasonScoreValues_RSPrefix {
	const parent = GetParentNodeL3(path);
	const argument = node.type == MapNodeType.Argument ? node : parent && parent.type == MapNodeType.Argument ? parent : null;
	const premises = node.type == MapNodeType.Argument ? GetNodeChildrenL3(argument, path).filter(a => a && a.type == MapNodeType.Claim) : [node];

	if (node.type == MapNodeType.Claim) {
		var claimTruthScore = RS_CalculateTruthScore(node, calculationPath);
		var claimBaseWeight = RS_CalculateBaseWeight(node, calculationPath);
	}
	if (argument) { // (node could instead be a claim under category)
		var argTruthScoreComposite = RS_CalculateTruthScoreComposite(argument, calculationPath);
		var argWeightMultiplier = RS_CalculateWeightMultiplier(argument, calculationPath);
		var argWeight = RS_CalculateWeight(argument, premises, calculationPath);
	}

	if (useRSPrefix) {
		return {
			argument, premises,
			rs_argTruthScoreComposite: argTruthScoreComposite, rs_argWeightMultiplier: argWeightMultiplier, rs_argWeight: argWeight,
			rs_claimTruthScore: claimTruthScore, rs_claimBaseWeight: claimBaseWeight,
		} as any;
	}
	return { argument, premises, argTruthScoreComposite, argWeightMultiplier, argWeight, claimTruthScore, claimBaseWeight } as any;
}

function CombinePremiseTruthScores(truthScores: number[], argumentType: ArgumentType) {
	if (argumentType == ArgumentType.All) {
		return truthScores.reduce((prev, cur) => prev * cur);
	}
	if (argumentType == ArgumentType.AnyTwo) {
		if (truthScores.length < 2) return 0;
		return truthScores.Max() * truthScores.Except(truthScores.Max()).Max();
	}
	return truthScores.Max(); // ArgumentType.Any
}

function GetChildArguments(node: MapNodeL3): MapNodeL3[] {
	const children = GetNodeChildrenL3(node);
	if (children == emptyArray_forLoading || children.Any(a => a == null)) return null; // null means still loading
	const childArguments = children.filter(a => a.type == MapNodeType.Argument);
	for (const child of childArguments) {
		const childChildren = GetNodeChildrenL3(child);
		if (childChildren == emptyArray_forLoading || childChildren.Any(a => a == null)) return null; // null means still loading
	}

	return childArguments;
}
