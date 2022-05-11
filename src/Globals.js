// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

const request = require('request-promise-native');

import * as _ from 'lodash';

import { Daemon } from 'kryptokrona-wallet-backend-js';

import { Alert } from 'react-native';

import NetInfo from "@react-native-community/netinfo";

import { getMessages, getLatestMessages } from './Database';

import Config from './Config';

import { Logger } from './Logger';
import { getCoinPriceFromAPI } from './Currency';
import { makePostRequest } from './NativeCode';

import {
    removeMessages, loadPayeeDataFromDatabase, savePayeeToDatabase, removePayeeFromDatabase,
    loadTransactionDetailsFromDatabase, saveTransactionDetailsToDatabase,
} from './Database';

class globals {
    constructor() {
        /* Can't really pass wallet between tab screens, and need it everywhere */
        this.wallet = undefined;

        /* Need to be able to cancel the background saving if we make a new wallet */
        this.backgroundSaveTimer = undefined;

        /* Want to cache this so we don't have to keep loading from DB/internet */
        this.coinPrice = 0;

        this.syncingMessages = false;

        /* Preferences loaded from DB */
        this.preferences = {
            currency: 'usd',
            notificationsEnabled: true,
            scanCoinbaseTransactions: false,
            limitData: false,
            theme: 'darkMode',
            authConfirmation: false,
            autoOptimize: false,
            authenticationMethod: 'hardware-auth',
            node: Config.defaultDaemon.getConnectionString(),
            language: 'en'
        };

        /* People in our address book */
        this.payees = [];

        this.logger = new Logger();

        this.updatePayeeFunctions = [];

        this.updateChatFunctions = [];

        /* Mapping of tx hash to address sent, payee name, memo */
        this.transactionDetails = [];

        this.daemons = [];

        this.messages = [];

        this.knownTXs = [];

        this.activeChat = '';

        this.language = 'en-US';

    }

    reset() {
        this.wallet = undefined;
        this.pinCode = undefined;
        this.backgroundSaveTimer = undefined;
        this.logger = new Logger();
        removeMessages();
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

    removePayee(nickname, removeMessages) {
        _.remove(Globals.payees, (item) => item.nickname === nickname);
        removePayeeFromDatabase(nickname, removeMessages);
        this.update();
    }

    update() {
        Globals.updatePayeeFunctions.forEach((f) => {
            f();
        });
    }

    async updateMessages() {
      this.messages = await getMessages();
      this.updateChat();
      let payees = await loadPayeeDataFromDatabase();

      if (payees !== undefined) {
          Globals.payees = payees;
      }

      this.update();

    }

    //
    // updateKnownTXs() {
    //
    // }

    updateChat() {
      console.log('updateChat');
      Globals.updateChatFunctions.forEach((f) => {
          f();
      });
    }

    getDaemon() {
        const [ host, port, ssl ] = this.preferences.node.split(':');

        let ssl_formatted = false;
        if (ssl == 'true') {
          ssl_formatted = true;
        }

        const daemon = new Daemon(host, Number(port), false, ssl_formatted);

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
        Globals.wallet.enableAutoOptimization(false);
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
        Globals.wallet.enableAutoOptimization(false);
    }

    await Globals.updateNodeList();
}
