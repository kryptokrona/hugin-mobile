// Copyright (C) 2018-2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import './shim';

import { AppRegistry } from 'react-native';

import BackgroundFetch from 'react-native-background-fetch';

import { name as appName } from './app.json';

import App from './src/App';
import { initSentry } from './src/Sentry';
import { Globals } from './src/Globals';
import { backgroundSync } from './src/BackgroundSync';

/* Stub out console.log in production */
if (!__DEV__) {
    console.log = () => {};
}

BackgroundFetch.registerHeadlessTask(async () => {
    try {
        await backgroundSync();
    } catch (error) {
        Globals.logger.addLogMessage("[js] RNBackgroundFetch failed to start: " + error.toString());
    }
});

initSentry();

AppRegistry.registerComponent(appName, () => App);
