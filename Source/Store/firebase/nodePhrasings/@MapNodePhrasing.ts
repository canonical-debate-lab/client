import { AddSchema } from 'Utils/FrameworkOverrides';
import { GetValues_ForSchema } from 'js-vextensions';

export class MapNodePhrasing {
	constructor(props: {node: string} & Partial<MapNodePhrasing>) {
		this.Extend(props);
	}

	_key?: string;
	node: string;
	type: MapNodePhrasingType;
	text: string;
	description: string;

	creator: string;
	createdAt: number;
}
AddSchema('MapNodePhrasing', {
	properties: {
		node: { type: 'string' },
		type: { $ref: 'MapNodePhrasingType' },
		text: { type: 'string' },
		description: { type: 'string' },

		creator: { type: 'string' },
		createdAt: { type: 'number' },
	},
	required: ['node', 'type', 'text', 'creator', 'createdAt'],
});

export enum MapNodePhrasingType {
	Precise = 10,
	Natural = 20,
}
AddSchema('MapNodePhrasingType', { oneOf: GetValues_ForSchema(MapNodePhrasingType) });
