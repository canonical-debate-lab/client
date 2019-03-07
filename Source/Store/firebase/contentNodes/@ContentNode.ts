import { Source } from 'Store/firebase/contentNodes/@SourceChain';
import {AddSchema} from 'Utils/FrameworkOverrides';
import { SourceChain } from './@SourceChain';

// todo: probably rename to "Quote"
export class ContentNode {
	constructor() {
		this.sourceChains = [
			{ sources: [new Source()] },
		];
	}
	content = '';
	sourceChains: SourceChain[];
}
AddSchema({
	properties: {
		content: { type: 'string' },
		sourceChains: { items: { $ref: 'SourceChain' } },
	},
	required: ['content', 'sourceChains'],
}, 'ContentNode');
