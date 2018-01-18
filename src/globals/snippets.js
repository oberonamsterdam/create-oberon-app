import chalk from 'chalk';

export const reduxSsr = {
    server: {
        from: [
            /const context = {};/gm,
            /<script src="\${assets\.client\.js}" defer><\/script>/gm,
            /import React from 'react';/gm,
            /<App \/>/gm,
            /\.get\('\/\*', \(/g,
        ],
        to: [
            `const context = {};
        const store = await createStore();`,
            `<script>window.__initialState = \${serialize(store.getState())};</script>
<script src="\${assets.client.js}" defer></script>`,
            `import React from 'react';
import createStore from './createStore';
import serialize from 'serialize-javascript';`,
            '<App store={store} />',
            '.get(\'/*\', async (',
        ],
    },
    client: {
        from: [
            /\nrender/g,
            /<App \/>/g,
            /\s$/g,
        ],
        to: [
            'import createStore from \'./createStore\';\n\ncreateStore(window.__initialState).then(store => {\nrender',
            '<App store={store} />',
            '\n});',
        ],
    },
};
export const reduxNoSsr = {
    index: {
        from: [
            /<App \/>/g,
            /\nReactDOM/g,
            /registerServiceWorker\(\)/g,
        ],
        to: [
            '<Provider store={store}><App /></Provider>',
            'import createStore from \'./createStore\';\nimport { Provider } from \'react-redux\';\n\ncreateStore(window.__initialState).then(store => {\nReactDOM',
            '});\nregisterServiceWorker()',
        ],
    },
};
export const flowReactNative = {
    flowConfig: `
[ignore]
.*/node_modules/.*
[include]

[libs]
flow-typed/npm
node_modules/react-native/Libraries/react-native/react-native-interface.js
node_modules/react-native/flow/
node_modules/expo/flow/

[version]
^0.56.0
`,
    flowTyped: `
// @flow

declare module 'react-native' {
    declare module.exports: any
}
`,
};

export const reactNativeSnippets = {
    app: `import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

class App extends React.Component {
    render () {
        return (
            <View style={styles.container}>
                <Text>Open up App.js to start working on your app!</Text>
                <Text>Changes you make will automatically reload.</Text>
                <Text>Shake your phone to open the developer menu.</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default registerRootComponent(App);`,

    appWithRedux: `import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { store } from '../createStore.js';

class App extends React.Component {
    render () {
        return (
            <Provider store={store}>
                <View style={styles.container}>
                    <Text>Open up App.js to start working on your app!</Text>
                    <Text>Changes you make will automatically reload.</Text>
                    <Text>Shake your phone to open the developer menu.</Text>
                </View>
            </Provider>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default registerRootComponent(App);`,

    createStore: `import { combineReducers, compose, createStore } from 'redux';

const initialState = {};

export const store = createStore(
    combineReducers({
        // add your reducers here
    }),
    initialState,
    compose(
        // add your middleware here
    ),
);`,
    createStoreWithPersist: `import { combineReducers, compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from 'redux-persist/lib/storage';

const initialState = {};
const persistConfig = {
    key: '__ROOT__',
    storage: AsyncStorage,
};
const rootReducer = combineReducers({
    myReducer: (state = {}, action) => ({ ...state, action }),
});
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(
    persistedReducer,
    initialState,
    compose(),
);

const persistor = persistStore(store);

export { store, persistor };`,
    appWithReduxPersist: `import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { store, persistor } from '../createStore.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react'

// Your loading view before redux-persist has rehydrated store
const Loading = () => null;

class App extends React.Component {
    render () {
        return (
            <Provider store={store}>
                <PersistGate persistor={persistor} loading={<Loading/>}>
                    <View style={styles.container}>
                        <Text>Open up App.js to start working on your app!</Text>
                        <Text>Changes you make will automatically reload.</Text>
                        <Text>Shake your phone to open the developer menu.</Text>
                    </View>
                </PersistGate>
            </Provider>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default registerRootComponent(App);`,
};

export const errors = {
    mobileNotAlphanumeric: `Due to how react-native forces alphanumeric appnames, you can't use non-alphanumeric characters in your appname.

wrong: my-awesome-app

good: myAwesomeApp

Please re-run CRS with an alphanumeric-only appname.`,
    ejectCRA: chalk`You indicated that you wanted to use {dim babel-polyfill} instead of the default polyfill. This requires ejecting from {dim create-react-app}, it will prompt you now.`,
};