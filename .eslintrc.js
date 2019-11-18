module.exports = {
	extends: [
		"airbnb-base",
		"plugin:react/recommended",
		//"plugin:jsx-a11y/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 8,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
			modules: true,
			//legacyDecorators: true
		}
	},
	plugins: [
		/*"@typescript-eslint",
		"import",
		"react",
		"react-hooks",
		//"jsx-a11y", // warns about accessibility concerns
		//"babel",*/
		"only-warn"
	],
	settings: {
		//"import/extensions": [".js", ".jsx", ".ts", ".tsx"],
		"import/resolver": {
			/*"webpack": {
				"config": "./Scripts/Build/WebpackConfig.js",
			},*/
			"node": {
				"paths": ["Source"],
				"extensions": [
				  ".js",
				  ".jsx",
				  ".ts",
				  ".tsx",
				]
			 }
		},
		"react": {
			"version": "detect", // to avoid warning
		},
	},
	env: {
		"browser": true,
		"commonjs": true,
		"es6": true,
		"node": true
	},
	rules: {
		"indent": ["error", "tab"],
		"no-tabs": "off",
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
		"no-restricted-syntax": ["off", "ForOfStatement"], // allow for-of loops for now
		"no-continue": "off",
		"import/no-useless-path-segments": "off", // disabled because vs-code's auto-import tool doesn't always write paths matching eslint's "fewest segments" criteria
		"react/display-name": "off", // doesn't handle inline react-render-functions well
		"class-methods-use-this": "off", // class-methods do not need to "use this" to be valid/useful -- for example: React's componentDidMount
		"object-property-newline": "off",
		"no-use-before-define": ["error", { "functions": false, "classes": false }],
		"sort-imports": "off", // there are a couple places (eg Main_Hot.tsx) where changing the import order will cause errors
		"arrow-body-style": "off",
		"no-await-in-loop": "off",
		"func-names": "off",
		"eqeqeq": "off", // disabled because it's one of the few rules which aren't autofixed, thus clashes with code from vwebapp-framework (which is the base for this project) reappear every time code is copied between them
		"no-debugger": "off", // sometimes adding a debugger call is useful
		"no-return-assign": "off",
		"no-plusplus": "off", // this is a very common pattern in a for-loop
		"operator-linebreak": "off", // messes up alignment of jsx tags otherwise
		"no-empty-pattern": "off", // breaks comp-prop-types definition for BaseComponentWithConnector, when connect-func does not itself use the props
		"no-lonely-if": "off",
		"no-void": "off",
		"consistent-return": "off",
		"no-loop-func": "off",
		"no-nested-ternary": "off",
		"no-use-before-define": "off", // for store-accessors that call each other
		"max-classes-per-file": "off",
		"prefer-destructuring": "off", // too many false positives (eg. vars *meant* as single-field access/alias)

		// plugins
		"react-hooks/rules-of-hooks": "error",
		"react-hooks/exhaustive-deps": ["warn", { "additionalHooks": "(Use(Memo|Callback|Effect)|Watch)" }]
	},
	globals: {
		ENV: true,
		DEV: true,
		PROD: true,
		TEST: true,
		DB: true,
		DB_SHORT: true,

		window: true,
		document: true,

		// some globals (allowed for quick debugging/testing without needing to add imports)
		React: true,
		Log: true,
		Assert: true,
		ToJSON: true,
		FromJSON: true,
		State: true,
		// other globals (kept to avoid circular import-chains, and/or for convenience)
		store: true,
		E: true,
	},
};