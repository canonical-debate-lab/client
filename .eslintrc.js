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
		"arrow-spacing": ["error", {"before": false, "after": true}],
		"object-curly-spacing": ["error", "never"]
	}
};