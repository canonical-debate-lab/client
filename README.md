# Canonical Debate Client

The official client website for the Canonical Debate project.

For more information, visit the website at: <https://canonicaldebate.com>

### Workspace setup

1) Clone the repo to disk: <https://github.com/canonical-debate-lab/client.git>
2) Run `npm install` in the project's root folder.

For recommended setup of your code editor and other tools, see: [Editor setup](#editor-setup)

### Running locally

1) Run `tsc` in a console, and keep it running in the background.
2) Run `npm run dev` in the root project folder. (or `npm run dev-with-stats`)
3) Navigate to `localhost:3005`.

### Firebase setup + project config (if forking)

1) Create two Google Firebase projects -- one for development, one for production.
2) Edit the `.firebaserc` and `Scripts/Build/CreateConfig.js` files, replacing their paths and data with your own.
3) Add at least one form of authentication to your Firebase projects. (Google sign-in is easiest)
4) Run the project locally. (see "Running locally" section below)
5) Sign in, using the panel at the top-right.
6) Add "?init=true" to the address-bar url, and reload the page.
7) Press the "Initialize database" button which will appear at the top-left.

### Deploying to Firebase

1) Run `tsc` in a console, and keep it running in the background. (this reduces deploy:prod-quick compile times from ~59s to ~32s, by enabling incremental compilation)
2) Run `npm run deploy:[dev/prod/prod-quick]`. Note that `deploy:prod-quick` time is ~32s, vs ~86s for `deploy:prod` (since the former doesn't use minification and such).

### Editor setup

The below are recommendations for your editor setup, which will make editing the project more efficient and less error prone. (due to matching our setup)

Browser: [Chrome](https://www.google.com/chrome)  
Editor: [Visual Studio Code](https://code.visualstudio.com)  
VSCode extensions:
* [Search node_modules](https://marketplace.visualstudio.com/items?itemName=jasonnutter.search-node-modules): Very helpful for quickly opening files in modules under `node_modules`.
* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint): Shows warnings when code does not match the project's coding style.

### Troubleshooting

* If you get an odd compile error or the CSS does not seem to be loading for the site (when recompiling), try deleting the cache at "node_modules/.cache/hard-source".

### Other documentation

* [Performance](/Docs/Performance.md)