// Copyright (C) 2018-2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import SQLite from 'react-native-sqlite-storage';

import * as _ from 'lodash';

import { AsyncStorage } from 'react-native';

import Config from './Config';
import Constants from './Constants';

import { Globals } from './Globals';

import { reportCaughtException } from './Sentry';

/* Use promise based API instead of callback based */
SQLite.enablePromise(true);

let database;

const databaseRowLimit = 1024 * 512;

export async function deleteDB() {
    try {
        await setHaveWallet(false);

        await SQLite.deleteDatabase({
            name: 'data.DB',
            location: 'default',
        });
    } catch (err) {
        Globals.logger.addLogMessage(err);
    }
}

/* https://stackoverflow.com/a/29202760/8737306 */
function chunkString(string, size) {
    const numChunks = Math.ceil(string.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; i++, o += size) {
        chunks[i] = string.substr(o, size);
    }

    return chunks;
}

async function saveWallet(wallet) {
    /* Split into chunks of 512kb */
    const chunks = chunkString(wallet, databaseRowLimit);

    await database.transaction((tx) => {
        tx.executeSql(
            `DELETE FROM wallet`
        );

        for (let i = 0; i < chunks.length; i++) {
            tx.executeSql(
                `INSERT INTO wallet
                    (id, json)
                VALUES
                    (?, ?)`,
                [ i, chunks[i] ]
            );
        }
    });
}

export async function loadWallet() {
    try {
        let [data] = await database.executeSql(
            `SELECT
                LENGTH(json) AS jsonLength
            FROM
                wallet`
        );

        if (data && data.rows && data.rows.length === 1) {
            const len = data.rows.item(0).jsonLength;
            let result = '';

            if (len > databaseRowLimit) {
                for (let i = 1; i <= len; i += databaseRowLimit) {
                    const [chunk] = await database.executeSql(
                        `SELECT
                            SUBSTR(json, ?, ?) AS data
                        FROM
                            wallet`,
                        [
                            i,
                            databaseRowLimit
                        ]
                    );

                    if (chunk && chunk.rows && chunk.rows.length === 1) {
                        result += chunk.rows.item(0).data;
                    }
                }

                return [ result, undefined ];
            }
        }

        [data] = await database.executeSql(
            `SELECT
                json
            FROM
                wallet
            ORDER BY
                id ASC`
        );

        if (data && data.rows && data.rows.length >= 1) {
            const len = data.rows.length;

            let result = '';

            for (let i = 0; i < len; i++) {
                result += data.rows.item(i).json;
            }

            return [ result, undefined ];
        }
    } catch (err) {
        reportCaughtException(err);
        return [ undefined, err ];
    }

    return [ undefined, 'Wallet not found in database!' ];
}

/* Create the tables if we haven't made them already */
async function createTables(DB) {
    const [dbVersionData] = await DB.executeSql(
        `PRAGMA user_version`,
    );

    let dbVersion = 0;

    if (dbVersionData && dbVersionData.rows && dbVersionData.rows.length >= 1) {
        dbVersion = dbVersionData.rows.item(0).user_version;
    }

    await DB.transaction((tx) => {
        
        /* We get JSON out from our wallet backend, and load JSON in from our
           wallet backend - it's a little ugly, but it's faster to just read/write
           json to the DB rather than structuring it. */
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS wallet (
                id INTEGER PRIMARY KEY,
                json TEXT
            )`
        );

        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY,
                currency TEXT,
                notificationsenabled BOOLEAN,
                scancoinbasetransactions BOOLEAN,
                limitdata BOOLEAN,
                theme TEXT,
                pinconfirmation BOOLEAN
            )`
        );

        /* Add new columns */
        if (dbVersion === 0) {
            tx.executeSql(
                `ALTER TABLE
                    preferences
                ADD
                    autooptimize BOOLEAN`
            );

            tx.executeSql(
                `ALTER TABLE
                    preferences
                ADD
                    authmethod TEXT`
            );
        }

        if (dbVersion === 0 || dbVersion === 1) {
            tx.executeSql(
                `ALTER TABLE
                    preferences
                ADD
                    node TEXT`
            );
        }

        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS payees (
                nickname TEXT,
                address TEXT,
                paymentid TEXT
            )`
        );

        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS transactiondetails (
                hash TEXT,
                memo TEXT,
                address TEXT,
                payee TEXT
            )`
        );

        /* Enter initial wallet value that we're going to overwrite later via
           primary key, provided it doesn't already exist */
        tx.executeSql(
            `INSERT OR IGNORE INTO wallet
                (id, json)
            VALUES
                (0, '')`
        );

        /* Setup default preference values */
        tx.executeSql(
            `INSERT OR IGNORE INTO preferences (
                id,
                currency,
                notificationsenabled,
                scancoinbasetransactions,
                limitdata,
                theme,
                pinconfirmation,
                autooptimize,
                authmethod,
                node
            )
            VALUES (
                0,
                'usd',
                1,
                0,
                0,
                'darkMode',
                0,
                1,
                'hardware-auth',
                ?
            )`,
            [
                Config.defaultDaemon.getConnectionString(),
            ],
        );

        /* Set new auto optimize column if not assigned yet */
        if (dbVersion === 0) {
            tx.executeSql(
                `UPDATE
                    preferences
                SET
                    autooptimize = 1,
                    authmethod = 'hardware-auth',
                    node = ?
                WHERE
                    id = 0`,
                [
                    Config.defaultDaemon.getConnectionString(),
                ],
            );
        } else if (dbVersion === 1) {
            tx.executeSql(
                `UPDATE
                    preferences
                SET
                    node = ?
                WHERE
                    id = 0`,
                [
                    Config.defaultDaemon.getConnectionString(),
                ],
            );
        }

        tx.executeSql(
            `PRAGMA user_version = 2`
        );
    });
}

export async function openDB() {
    try {
        database = await SQLite.openDatabase({
            name: 'data.DB',
            location: 'default',
        });

        await createTables(database);
    } catch (err) {
        Globals.logger.addLogMessage('Failed to open DB: ' + err);
    }
}

export async function savePreferencesToDatabase(preferences) {
    await database.transaction((tx) => {
        tx.executeSql(
            `UPDATE
                preferences
            SET
                currency = ?,
                notificationsenabled = ?,
                scancoinbasetransactions = ?,
                limitdata = ?,
                theme = ?,
                pinconfirmation = ?,
                autooptimize = ?,
                authmethod = ?,
                node = ?
            WHERE
                id = 0`,
            [
                preferences.currency,
                preferences.notificationsEnabled ? 1 : 0,
                preferences.scanCoinbaseTransactions ? 1 : 0,
                preferences.limitData ? 1 : 0,
                preferences.theme,
                preferences.authConfirmation ? 1 : 0,
                preferences.autoOptimize ? 1 : 0,
                preferences.authenticationMethod,
                preferences.node,
            ]
        );
    });
}

export async function loadPreferencesFromDatabase() {
    const [data] = await database.executeSql(
        `SELECT
            currency,
            notificationsenabled,
            scancoinbasetransactions,
            limitdata,
            theme,
            pinconfirmation,
            autooptimize,
            authmethod,
            node
        FROM
            preferences
        WHERE
            id = 0`,
    );

    if (data && data.rows && data.rows.length >= 1) {
        const item = data.rows.item(0);

        return {
            currency: item.currency,
            notificationsEnabled: item.notificationsenabled === 1,
            scanCoinbaseTransactions: item.scancoinbasetransactions === 1,
            limitData: item.limitdata === 1,
            theme: item.theme,
            authConfirmation: item.pinconfirmation === 1,
            autoOptimize: item.autooptimize === 1,
            authenticationMethod: item.authmethod,
            node: item.node,
        }
    }

    return undefined;
}

export async function savePayeeToDatabase(payee) {
    await database.transaction((tx) => {
        tx.executeSql(
            `INSERT INTO payees
                (nickname, address, paymentid)
            VALUES
                (?, ?, ?)`,
            [
                payee.nickname,
                payee.address,
                payee.paymentID,
            ]
        );
    });
}

export async function removePayeeFromDatabase(nickname) {
    await database.transaction((tx) => {
        tx.executeSql(
            `DELETE FROM
                payees
            WHERE
                nickname = ?`,
            [ nickname ]
        );
    });
}

export async function loadPayeeDataFromDatabase() {
    const [data] = await database.executeSql(
        `SELECT
            nickname,
            address,
            paymentid
        FROM
            payees`
    );

    if (data && data.rows && data.rows.length) {
        const res = [];

        for (let i = 0; i < data.rows.length; i++) {
            const item = data.rows.item(i);
            res.push({
                nickname: item.nickname,
                address: item.address,
                paymentID: item.paymentid,
            });
        }

        return res;
    }

    return undefined;
}

export async function saveToDatabase(wallet) {
    try {
        await saveWallet(wallet.toJSONString());
        await setHaveWallet(true);
    } catch (err) {
        reportCaughtException(err);
        Globals.logger.addLogMessage('Err saving wallet: ' + err);
    };
}

export async function haveWallet() {
    try {
        const value = await AsyncStorage.getItem(Config.coinName + 'HaveWallet');
        
        if (value !== null) {
            return value === 'true';
        }

        return false;
    } catch (error) {
        reportCaughtException(error);
        Globals.logger.addLogMessage('Error determining if we have data: ' + error);
        return false;
    }
}

export async function setHaveWallet(haveWallet) {
    try {
        await AsyncStorage.setItem(Config.coinName + 'HaveWallet', haveWallet.toString());
    } catch (error) {
        reportCaughtException(error);
        Globals.logger.addLogMessage('Failed to save have wallet status: ' + error);
    }
}

export async function saveTransactionDetailsToDatabase(txDetails) {
    await database.transaction((tx) => {
        tx.executeSql(
            `INSERT INTO transactiondetails
                (hash, memo, address, payee)
            VALUES
                (?, ?, ?, ?)`,
            [
                txDetails.hash,
                txDetails.memo,
                txDetails.address,
                txDetails.payee
            ]
        );
    });
}

export async function loadTransactionDetailsFromDatabase() {
    const [data] = await database.executeSql(
        `SELECT
            hash,
            memo,
            address,
            payee
        FROM
            transactiondetails`
    );

    if (data && data.rows && data.rows.length) {
        const res = [];

        for (let i = 0; i < data.rows.length; i++) {
            const item = data.rows.item(i);
            res.push({
                hash: item.hash,
                memo: item.memo,
                address: item.address,
                payee: item.payee,
            });
        }

        return res;
    }

    return undefined;
}
