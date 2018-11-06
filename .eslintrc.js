module.exports = {
	extends: "airbnb-base",
	parser: "typescript-eslint-parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
			modules: true
		}
	},
	rules: {
		"indent": ["error", "tab"],
		"no-tabs": 0,
		"import/no-extraneous-dependencies": ["error", {"devDependencies": true}],
		"max-len": "off",
		"padded-blocks": "off", // disabled since it incorrectly perceives a commented first-line as being an empty line
		"no-param-reassign": "off",
		"import/prefer-default-export": "off",
		"camelcase": "off",
		"lines-between-class-members": "off",
		"strict": ["error", "never"] // fix for extraneous (and incorrect) entry for "strict" rule in airbnb-base/index.js
	}
};