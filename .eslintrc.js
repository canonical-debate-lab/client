module.exports = {
	extends: [
		"airbnb-base",
		"plugin:react/recommended",
		"plugin:jsx-a11y/recommended",
	],
	parser: "typescript-eslint-parser",
	parserOptions: {
		ecmaVersion: 8,
		ecmaFeatures: {
			jsx: true,
			modules: true
		}
	},
	plugins: [
		"import",
		"react",
		"jsx-a11y",
		//"babel",
	],
	settings: {
		"import/extensions": [".js", ".jsx", ".ts", ".tsx"],
		"import/resolver": {
			"webpack": {
				"config": "./Scripts/Build/WebpackConfig.js"
			}
		}
	},
	env: {
		"browser": true,
		"commonjs": true,
		"es6": true,
		"node": true
	},
	globals : {
		/*"DEV": false,
		"PROD": false,
		"TEST": false,*/
	},
	rules: {
		"indent": ["error", "tab"],
		"no-tabs": 0,
		"import/no-extraneous-dependencies": ["error", {"devDependencies": true}],
		"max-len": "off",
		"padded-blocks": "off", // disabled since it incorrectly perceives a commented first-line as being an empty line
		"lines-between-class-members": "off",
		"no-param-reassign": "off",
		"import/prefer-default-export": "off",
		"camelcase": "off",
		"strict": ["error", "never"], // fix for extraneous (and incorrect) entry for "strict" rule in airbnb-base/index.js
		"dot-notation": "off", // disabling this lets us access custom properties on window (dot notation throws TS error, and if this were enabled, you couldn't use bracket notation either)
		"no-underscore-dangle": ["error", {"allow": ["__webpack_require__"]}], // lets us access the special __webpack_require__ variable
		"no-console": "off", // lets us use console.log, etc.
		"object-curly-newline": "off", // fixes that eslint would complain about vscode's import reformatting, when more than 3 variables were imported from a single file
		"no-restricted-syntax": [0, "ForOfStatement"], // allow for-of loops for now
		"no-continue": "off"
	},
	globals: {
		ENV: true,
		ENV_SHORT: true,
		DEV: true,
		PROD: true,
		TEST: true,

		window: true,
		document: true,

		store: true,
	},
};