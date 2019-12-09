import { Rule } from 'webpack-string-replacer';

export const patchRules: Rule[] = [
	{
		fileInclude: /immer.module.js$/,
		fileMatchCount: { min: 2 },
		replacements: [
			{
				pattern: 'function shallowCopy(base, invokeGetters) {',
				patternMatchCount: { min: 2 },
				replacement: 'function shallowCopy(base, invokeGetters) { invokeGetters = true;',
			},
		],
	},
];
