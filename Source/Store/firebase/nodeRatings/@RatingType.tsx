import { Range, Assert } from 'js-vextensions';
import { ArgumentType } from 'Store/firebase/nodes/@MapNodeRevision';
import { PropNameToTitle } from 'Utils/General/Others';
import { AddSchema } from 'vwebapp-framework';
import { GetFinalPolarity, GetLinkUnderParent, GetNodeForm, IsMultiPremiseArgument } from '../nodes/$node';
import { MapNodeL2, MapNodeL3, Polarity } from '../nodes/@MapNode';
import { MapNodeType } from '../nodes/@MapNodeType';

// export type RatingType = "significance" | "neutrality" | "probability" | "intensity" | "adjustment" | "strength";
// export type RatingType = "significance" | "neutrality" | "probability" | "support" | "adjustment" | "strength";
// export const ratingTypes = ["significance", "neutrality", "probability", "truth", "impact", "strength"];
export const ratingTypes = ['significance', 'neutrality', 'truth', 'relevance', 'impact'];
export type RatingType = 'significance' | 'neutrality' | 'truth' | 'relevance' | 'impact';
AddSchema('RatingType', {
	oneOf: ratingTypes.map((a) => ({ const: a })),
});

export function GetRatingTypeInfo(ratingType: RatingType, node: MapNodeL2, parent: MapNodeL3, path: string) {
	const link = GetLinkUnderParent(node._key, parent);
	const finalPolarity = link ? GetFinalPolarity(link.polarity, GetNodeForm(parent)) : Polarity.Supporting;
	const isMultiPremiseArgument = IsMultiPremiseArgument(node);

	const result = new RatingType_Info();
	result.displayText = PropNameToTitle(ratingType);
	result.labels = Range(0, 100);
	result.values = Range(0, 100);
	result.tickInterval = 5;

	if (ratingType == 'significance') {
		result.description = 'How significant/important is this subject? (0: not worth any time discussing, 100: vital to discuss)';
	} else if (ratingType == 'neutrality') {
		result.description = 'How neutral/impartial is the phrasing of this statement/question? (0: as biased as they come, 100: no bias)';
	} /* else if (ratingType == "probability") {
		//result.description = "Suppose you were as sure as you are right now (of this claim being true, in its basic form), 100 different times (on different topics). How many of those times do you expect you'd be correct?";
		result.description = "Consider how sure you are of this statement being true (in its basic form). If you were this sure 100 times (on a variety of things), how many of those times do you think you'd be correct?";
	} */ else if (ratingType == 'truth') {
		// result.description = "To what degree do you consider this statement true? (0: completely false, 50: true to a basic extent, 100: true to a high extent)";
		result.description = 'To what degree do you consider this statement true? (0: completely false, 50: somewhat true, 100: completely true)';
	} else if (ratingType == 'impact') {
		result.description = 'Argument impact is calculated by combining (multiplying) the truth and relevance ratings.';
	} else if (ratingType == 'relevance') {
		Assert(node.type == MapNodeType.Argument, `Invalid state. Node with rating-type "relevance" should be an argument. @path:${path}`);

		const premiseCountrStrMap = {
			// [ArgumentType.All]: `all of the premises`,
			[ArgumentType.All]: 'they',
			[ArgumentType.AnyTwo]: 'at least two of them',
			[ArgumentType.Any]: 'at least one of them',
		};
		const premiseCountStr = premiseCountrStrMap[node.current.argumentType];

		result.description = isMultiPremiseArgument
			? `Assuming ${premiseCountStr} were true, how relevant/impactful would the statements (premises) below this be toward the parent claim? (0: not at all, 50: moderately, 100: game-changing)`
			: 'Assuming it were true, how relevant/impactful would this statement be toward the parent claim? (0: not at all, 50: moderately, 100: game-changing)';
	} else {
		Assert(false, `Invalid rating type: ${ratingType}`);
	}

	return result;
}

/* intensity: new RatingType_Info({
	displayText: "Intensity",
	//description: ()=>"What intensity should this statement be strengthened/weakened to, to reach its ideal state? (making substantial claims while maintaining accuracy)",
	//description: ()=>"To what intensity is this statement true? (100 = your estimate of the average opinion)",
	description: ()=>"To what intensity is the basic idea true? (100: your estimate of the average opinion)",
	/*options: [1, 2, 4, 6, 8].concat(Range(10, 200, 5)),
	ticks: [1].concat(Range(20, 200, 20)),*#/
	options: ()=>Range(0, 200),
	ticks: ()=>Range(0, 200, 10),
}), */
/* evidence: new RatingType_Info({
	displayText: "Evidence",
	description: ()=>"To what level should the average opinion on this statement be shifted to match the evidence?",
	options: ()=>Range(0, 200),
	ticks: ()=>Range(0, 200, 10),
}), */
/* backing: new RatingType_Info({
	displayText: "Backing",
	description: ()=>"How strong is the backing/evidence for this statement? (100: your estimate of the average opinion)",
	options: ()=>Range(0, 200),
	ticks: ()=>Range(0, 200, 10),
}), */
/* correction: new RatingType_Info({
	displayText: "Correction",
	description: ()=>"How much should the average opinion on this statement be shifted to be most reasonable?",
	options: ()=>Range(-100, 100),
	ticks: ()=>Range(-100, 100, 10),
}), */
/* support: new RatingType_Info({
	displayText: "Support",
	description: ()=>"Where do you consider your views on this statement, relative to the rest of the population? (-100: very critical, 0: neither critical nor supportive, +100: very supportive)",
	options: ()=>Range(-100, 100),
	ticks: ()=>Range(-100, 100, 10),
	//tickFormatter: tick=>(tick < 0 ? "-" : tick > 1 ? "+" : "") + tick.Distance(0) //+ "%"
	tickRender: props=> {
		let {x, y, stroke, fill, payload} = props;
		let tick = payload.value;
		let tickStr = (tick < 0 ? "-" : tick == 0 ? "" : "+") + tick.Distance(0);
		return (
			<g transform={`translate(${x},${y - 5})`}>
				<text x={0} y={0} dy={16} stroke={stroke} fill="#AAA"
						textAnchor={"end"}
						transform={"rotate(-25)"}>
					{tickStr}
				</text>
			</g>
		);
	}
}), */

export class RatingType_Info {
	constructor(initialData?: Partial<RatingType_Info>) {
		this.VSet(initialData);
	}

	displayText: string;
	description: string | ((..._)=>JSX.Element);
	labels: number[];
	values: number[];
	tickInterval: number;
	// tickFormatter?: (tickValue: number)=>string = a=>a.toString();
	tickRender?: (props: TickRenderProps)=>JSX.Element;
	/* tickRender?: (props: TickRenderProps)=>JSX.Element = props=> {
		let {x, y, stroke, fill, payload} = props;
		let tickStr = payload.value + "%";
		return (
			<g transform={`translate(${x},${y - 5})`}>
				<text x={0} y={0} dy={16} stroke={stroke} fill="#AAA"
						textAnchor={"middle"}
						transform={"rotate(-25)"}>
					{tickStr}
				</text>
			</g>
		);
	} */
	/* tickRender?: (props: TickRenderProps)=>JSX.Element = props=> {
		let {x, y, stroke, fill, payload} = props;
		let tickStr = payload.value + "%";
		return (
			<g transform={`translate(${x},${y - 5})`}>
				<text x={0} y={0} dy={16} stroke={stroke} fill="#AAA" textAnchor={"middle"}>
					{tickStr}
				</text>
				<text x={0} y={10} dy={16} stroke={stroke} fill="#AAA" textAnchor={"middle"}>
					{"%"}
				</text>
			</g>
		);
	} */
}

type TickRenderProps = {
	fill: string,
	height: number,
	index: number,
	payload,
	stroke: string,
	textAnchor: string,
	verticalAnchor: string,
	viewBox,
	width: number,
	x: number,
	y: number,
};
