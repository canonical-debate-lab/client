import { AddSchema } from 'Utils/FrameworkOverrides';

export class TermComponent {
	constructor(initialData: {text: string} & Partial<TermComponent>) {
		this.Extend(initialData);
		// this.createdAt = Date.now();
	}

	_key?: string;
	text: string;

	parentTerms: ParentTermSet;
}
AddSchema({
	properties: {
		text: { type: 'string' },
		parentTerms: { $ref: 'ParentTermSet' },
	},
	required: ['text', 'parentTerms'],
}, 'TermComponent');

/* export type ParentTermSet = {[key: number]: ParentTerm};
AddSchema({patternProperties: {"^[A-Za-z0-9_-]+$": {$ref: "ParentTerm"}}}, "ParentTermSet");
export type ParentTerm = boolean;
AddSchema({type: "boolean"}, "ParentTerm"); */
export type ParentTermSet = {[key: string]: boolean};
AddSchema({ patternProperties: { '^[A-Za-z0-9_-]+$': { type: 'boolean' } } }, 'ParentTermSet');
