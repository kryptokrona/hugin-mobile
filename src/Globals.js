// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

const request = require('request-promise-native');

import * as _ from 'lodash';

import { Daemon } from 'kryptokrona-wallet-backend-js';

import { Alert } from 'react-native';

import NetInfo from "@react-native-community/netinfo";

import Config from './Config';

import { Logger } from './Logger';
import { getCoinPriceFromAPI } from './Currency';
import { makePostRequest } from './NativeCode';

import {
    loadPayeeDataFromDatabase, savePayeeToDatabase, removePayeeFromDatabase,
    loadTransactionDetailsFromDatabase, saveTransactionDetailsToDatabase,
} from './Database';

class globals {
    constructor() {
        /* Can't really pass wallet between tab screens, and need it everywhere */
        this.wallet = undefined;

        /* Need to be able to cancel the background saving if we make a new wallet */
        this.backgroundSaveTimer = undefined;

        /* Want to cache this so we don't have to keep loading from DB/internet */
        this.coinPrice = {};

        /* Preferences loaded from DB */
        this.preferences = {
            currency: 'usd',
            notificationsEnabled: true,
            scanCoinbaseTransactions: false,
            limitData: false,
            theme: 'darkMode',
            authConfirmation: false,
            autoOptimize: true,
            authenticationMethod: 'hardware-auth',
            node: Config.defaultDaemon.getConnectionString(),
        };

        /* People in our address book */
        this.payees = [];

        this.logger = new Logger();

        this.updatePayeeFunctions = [];

        /* Mapping of tx hash to address sent, payee name, memo */
        this.transactionDetails = [];

        this.daemons = [];
    }

    reset() {
        this.wallet = undefined;
        this.pinCode = undefined;
        this.backgroundSaveTimer = undefined;
        this.logger = new Logger();
    }

    addTransactionDetails(txDetails) {
        Globals.transactionDetails.push(txDetails);
        saveTransactionDetailsToDatabase(txDetails);
    }

    addPayee(payee) {
        Globals.payees.push(payee);
        savePayeeToDatabase(payee);
        this.update();
    }

    removePayee(nickname) {
        _.remove(Globals.payees, (item) => item.nickname === nickname);
        removePayeeFromDatabase(nickname);
        this.update();
    }

    update() {
        Globals.updatePayeeFunctions.forEach((f) => {
            f();
        });
    }

    getDaemon() {
        const [ host, port ] = this.preferences.node.split(':');

        const daemon = new Daemon(host, Number(port), undefined, false);

        if (Platform.OS === 'android') {
            /* Override with our native makePostRequest implementation which can
               actually cancel requests part way through */
            daemon.makePostRequest = makePostRequest;
        }

        return daemon;
    }

    async updateNodeList() {
        try {
            const data = await request({
                json: true,
                method: 'GET',
                timeout: Config.requestTimeout,
                url: Config.nodeListURL,
            });

            if (data.nodes) {
                this.daemons = data.nodes;
            }
        } catch (error) {
            this.logger.addLogMessage('Failed to get node list from API: ' + error.toString());
        }
    }
}

export let Globals = new globals();

function updateConnection(connection) {
    if (Globals.preferences.limitData && connection.type === 'cellular') {
        Globals.wallet.stop();
    } else {
        Globals.wallet.start();
    }
}

/* Note... you probably don't want to await this function. Can block for a while
   if no internet. */
export async function initGlobals() {
    const payees = await loadPayeeDataFromDatabase();

    if (payees !== undefined) {
        Globals.payees = payees;
    }

    const transactionDetails = await loadTransactionDetailsFromDatabase();

    if (transactionDetails !== undefined) {
        Globals.transactionDetails = transactionDetails;
    }

    const netInfo = await NetInfo.fetch();

    /* Start syncing */
    if ((Globals.preferences.limitData && netInfo.type === 'cellular')) {
        Alert.alert(
            'Not Syncing',
            'You enabled data limits, and are on a limited connection. Not starting sync.',
            [
                {text: 'OK'},
            ]
        );
    } else {
        Globals.wallet.start();
    }

    await Globals.updateNodeList();
}
