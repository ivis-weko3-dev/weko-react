# WEKO Create React App

<img alt="Logo" align="right" src="https://create-react-app.dev/img/logo.svg" width="20%" />

Create React apps with no build configuration.

- [Creating an App](#creating-an-app) – How to create a new app.
- [Building an App](#building-an-app) – How to build an existing app.
- [Injecting into WEKO3 module](#injecting-into-weko3-module) – How to injecting app-module into WEKO3 module.
- [User Guide](https://facebook.github.io/create-react-app/) – How to develop apps bootstrapped with Create React App.

Create React App works on macOS, Windows, and Linux.<br>

### Get Started Immediately

You **don’t** need to install or configure tools like webpack or Babel.<br>
They are preconfigured and hidden so that you can focus on the code.

Create a new WEKO app module, and you’re good to go.

## Creating an App

**You’ll need to have Node 10.16.0 or later version on your local development machine** (but it’s not required on the server). We recommend using the latest LTS version. You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to switch Node versions between different projects.

To create a new app, you may choose one of the following methods:

### npx

```sh
npx create-react-app app-module-name
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner tool that comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

### npm

```sh
npm init react-app app-module-name
```

_`npm init <initializer>` is available in npm 6+_

### Yarn

```sh
yarn create react-app app-module-name
```

_[`yarn create <starter-kit-package>`](https://yarnpkg.com/lang/en/docs/cli/create/) is available in Yarn 0.25+_

It will create a directory called `app-module-name` inside the current folder.<br>
Inside that directory, it will generate the initial project structure and install the transitive dependencies:

```
app-module-name
├── README.md
├── node_modules
├── package.json
├── public
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
└── src
    ├── ModuleName.css
    ├── ModuleName.js
    ├── ModuleName.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    └── serviceWorker.js
    └── setupTests.js
```

No configuration or complicated folder structures, only the files you need to build your app.<br>
Once the installation is done, you can open your project folder:

```sh
cd app-module-name
```

Inside the newly created project, you can run some built-in commands:

### `npm start` or `yarn start`

Runs the app in development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will automatically reload if you make changes to the code.<br>
You will see the build errors and lint warnings in the console.

<p align='center'>
<img src='https://cdn.jsdelivr.net/gh/marionebl/create-react-app@9f6282671c54f0874afd37a72f6689727b562498/screencast-error.svg' width='600' alt='Build errors'>
</p>

### `npm test` or `yarn test`

Runs the test watcher in an interactive mode.<br>
By default, runs tests related to files changed since the last commit.

## Building an App

### `npm install` or `yarn install`

Install is used to install all dependencies for an app module. This is most commonly used when you have just checked out code for a module, or when another developer on the module has added a new dependency that you need to pick up.

### `npm run build` or `yarn build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>

Your app is ready to be deployed.


## Injecting into WEKO3 module

### `Change file name`

After process build, you can't found build results in `app-module-name/build/static/` contained `css` and `js` folders. 

Change that file's name following these rule:

- In folder `css`:
  ```sh
    *.chunk.css         --> app-module-name.chunk.css
  ```

- In folder `js`:
  ```sh
    *.chunk.js          --> app-module-name.chunk.js
    main.*.chunk.js     --> app-module-name.main.chunk.js
    runtime-main.*.js   --> app-module-name.runtime-main.js
  ```
### `Move built file into WEKO3 module`

Copy files above into corresponding folder in `WEKO3`'s source:

```
module
├── weko-app-module
│   └── weko_app_module
|       └── static
|           ├── css
|           |   └── weko_app_module
|           |       └── *PUT CSS FILE HERE*
|           └── js
|               └── weko_app_module
|                   └── *PUT JS FILE HERE*
```

## Further help

If something doesn’t work, please [file an issue](https://github.com/facebook/create-react-app/issues/new).<br>
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/facebook/create-react-app/discussions).
