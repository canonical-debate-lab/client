module.exports = {
	extends: [
		"airbnb-base",
		"plugin:react/recommended",
		//"plugin:jsx-a11y/recommended",
	],
	parser: "typescript-eslint-parser",
	parserOptions: {
		ecmaVersion: 8,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
			modules: true
		}
	},
	plugins: [
		"import",
		"react",
		//"jsx-a11y", // warns about accessibility concerns
		//"babel",
		"only-warn",
	],
	settings: {
		//"import/extensions": [".js", ".jsx", ".ts", ".tsx"],
		"import/resolver": {
			"webpack": {
				"config": "./Scripts/Build/WebpackConfig.js",
			},
			"node": {
				"paths": ["Source"],
				"extensions": [
				  ".js",
				  ".jsx",
				  ".ts",
				  ".tsx",
				]
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
		"no-underscore-dangle": ["error", {"allow": ["__webpack_require__", "_key", "_id"]}], // lets us access some special variables/properties
		"no-console": "off", // lets us use console.log, etc.
		"object-curly-newline": "off", // fixes that eslint would complain about vscode's import reformatting, when more than 3 variables were imported from a single file
		"no-restricted-syntax": [0, "ForOfStatement"], // allow for-of loops for now
		"no-continue": "off",
		"import/no-useless-path-segments": "off", // disabled because vs-code's auto-import tool doesn't always write paths matching eslint's "fewest segments" criteria
		"class-methods-use-this": "off", // class-methods do not need to "use this" to be valid/useful -- for example: React's componentDidMount
		"object-property-newline": "off",
		"no-use-before-define": ["error", { "functions": false, "classes": false }],
		"sort-imports": "off", // there are a couple places (eg Main_Hot.tsx) where changing the import order will cause errors
		"arrow-body-style": "off",
		"no-await-in-loop": "off",
		"func-names": "off",
	},
	globals: {
		ENV: true,
		ENV_SHORT: true,
		DEV: true,
		PROD: true,
		TEST: true,

		window: true,
		document: true,

		React: true,
		State: true,
		Assert: true,
		Log: true,
		store: true,
		ToJSON: true,
		FromJSON: true,
	},
};