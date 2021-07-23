// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import BackgroundFetch from 'react-native-background-fetch';

import { AppState, Platform, PushNotificationIOS } from 'react-native';

import { WalletBackend, LogLevel } from 'kryptokrona-wallet-backend-js';

import PushNotification from 'react-native-push-notification';

import NetInfo from '@react-native-community/netinfo';

import Config from './Config';

import { Globals } from './Globals';

import { sendNotification } from './MainScreen';

import { processBlockOutputs, makePostRequest } from './NativeCode';

import {
    saveToDatabase, haveWallet, loadWallet, openDB, loadPreferencesFromDatabase
} from './Database';

export function initBackgroundSync() {
    BackgroundFetch.configure({
        minimumFetchInterval: 15, // <-- minutes (15 is minimum allowed)
        stopOnTerminate: false,
        startOnBoot: true,
        forceReload: false,
        enableHeadless: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    }, async () => {
        await backgroundSync();
    }, (error) => {
        Globals.logger.addLogMessage("[js] RNBackgroundFetch failed to start: " + error.toString());
    });
}

let State = {
    shouldStop: false,
    running: false,
    unsubscribe: () => {},
}

function onStateChange(state) {
    if (state !== 'background') {
        State.shouldStop = true;
    }
}

async function handleNetInfoChange({ type }) {
    if (Globals.preferences.limitData && type === 'cellular') {
        Globals.logger.addLogMessage("[Background Sync] Network connection changed to cellular, and we are limiting data. Stopping sync.");
        State.shouldStop = true;
    }
}

/**
 * Check background syncing is all good and setup a few vars
 */
async function setupBackgroundSync() {
    /* Probably shouldn't happen... but check we're not already running. */
    if (State.running) {
        Globals.logger.addLogMessage('[Background Sync] Background sync already running. Not starting.');
        return false;
    }

    /* Not in the background, don't sync */
    if (AppState.currentState !== 'background') {
        Globals.logger.addLogMessage('[Background Sync] Background sync launched while in foreground. Not starting.');
        return false;
    }

    /* Wallet not loaded yet. Probably launching from headlessJS */
    if (Globals.wallet === undefined) {
        const backgroundInitSuccess = await fromHeadlessJSInit();

        if (!backgroundInitSuccess) {
            return false;
        }
    }

    const netInfo = await NetInfo.fetch();

    if (Globals.preferences.limitData && netInfo.type === 'cellular') {
        Globals.logger.addLogMessage('[Background Sync] On mobile data. Not starting background sync.');
        return false;
    }

    State.unsubscribe = NetInfo.addEventListener(handleNetInfoChange);

    AppState.addEventListener('change', onStateChange);

    State.shouldStop = false;

    Globals.logger.addLogMessage('[Background Sync] Running background sync...');

    return true;
}

/**
 * Complete the background syncing and pull down a few vars
 */
function finishBackgroundSync() {
    AppState.removeEventListener('change', onStateChange);

    State.unsubscribe();

    BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);

    State.running = false;

    Globals.logger.addLogMessage('[Background Sync] Background sync complete.');
}

async function fromHeadlessJSInit() {
    /* See if user has previously made a wallet */
    const hasWallet = await haveWallet();

    if (!hasWallet) {
        Globals.logger.addLogMessage('[Background Sync] No wallet stored. Not starting background sync.');
        return false;
    }

    await openDB();

    const prefs = await loadPreferencesFromDatabase();

    if (prefs !== undefined) {
        Globals.preferences = prefs;
    }

    /* Load wallet data from DB */
    let [walletData, dbError] = await loadWallet();

    if (dbError) {
        Globals.logger.addLogMessage('[Background Sync] Failed to load wallet. Not starting background sync.');
        return false;
    }

    const [wallet, walletError] = await WalletBackend.loadWalletFromJSON(
        Globals.getDaemon(), walletData, Config
    );

    if (walletError) {
        Globals.logger.addLogMessage('[Background Sync] Failed to load wallet. Not starting background sync.');
        return false;
    }

    Globals.wallet = wallet;

    Globals.wallet.scanCoinbaseTransactions(Globals.preferences.scanCoinbaseTransactions);
    Globals.wallet.enableAutoOptimization(Globals.preferences.autoOptimize);

    /* Remove any previously added listeners to pretend double notifications */
    Globals.wallet.removeAllListeners('incomingtx');

    Globals.wallet.on('incomingtx', (transaction) => {
        sendNotification(transaction);
    });

    Globals.wallet.setLoggerCallback((prettyMessage, message) => {
        Globals.logger.addLogMessage(message);
    });

    Globals.wallet.setLogLevel(LogLevel.DEBUG);

    /* Use our native C++ func to process blocks, provided we're on android */
    /* TODO: iOS support */
    if (Platform.OS === 'android') {
        Globals.wallet.setBlockOutputProcessFunc(processBlockOutputs);
    }

    PushNotification.configure({
        onNotification: (notification) => {
            notification.finish(PushNotificationIOS.FetchResult.NoData);
        },

        permissions: {
            alert: true,
            badge: true,
            sound: true,
        },

        popInitialNotification: true,

        requestPermissions: true,
    });

    return true;
}

/**
 * Perform the background sync itself.
 * Note - don't use anything with setInterval here, it won't run in the background
 */
export async function backgroundSync() {
    if (!await setupBackgroundSync()) {
        BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NO_DATA);
        return;
    } else {
        State.running = true;
    }

    const startTime = new Date();

    /* ios only allows 30 seconds of runtime. Android allows... infinite???
       Since we run every 15 minutes, just set it to 14 for android.
       Not exactly sure on this. */
    let allowedRunTime = Platform.OS === 'ios' ? 25 : (60 * 14);

    let secsRunning = 0;

    /* Run for 25 seconds or until the app comes back to the foreground */
    while (!State.shouldStop && secsRunning < allowedRunTime) {
        /* Update the daemon info */
        await Globals.wallet.internal().updateDaemonInfo();

        const [walletBlockCount, localDaemonBlockCount, networkBlockCount] = Globals.wallet.getSyncStatus();

        /* Check if we're synced so we don't kill the users battery */
        if (walletBlockCount >= localDaemonBlockCount || walletBlockCount >= networkBlockCount) {
            Globals.logger.addLogMessage('[Background Sync] Wallet is synced. Stopping background sync.');

            /* Save the wallet */
            saveToDatabase(Globals.wallet);

            break;
        }

        /* Process 1000 blocks */
        for (let i = 0; i < (1000 / Config.blocksPerTick); i++) {
            if (State.shouldStop) {
                break;
            }

            const syncedBlocks = await Globals.wallet.internal().sync(false);

            if (!syncedBlocks) {
                break;
            }
        }

        Globals.logger.addLogMessage('[Background Sync] Saving wallet in background.');

        /* Save the wallet */
        saveToDatabase(Globals.wallet);

        /* Update our running time */
        secsRunning = (new Date() - startTime) / 1000;
    }

    finishBackgroundSync();
}
