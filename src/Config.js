// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import { Platform } from 'react-native';

import { MixinLimit, MixinLimits, Daemon } from 'kryptokrona-wallet-backend-js';

import {
    derivePublicKey, generateKeyDerivation, generateRingSignatures,
    deriveSecretKey, generateKeyImage, checkRingSignature,
} from './NativeCode';

const Config = new function() {
    /**
     * If you can't figure this one out, I don't have high hopes
     */
    this.coinName = 'kryptokrona';

    /**
     * Prefix for URI encoded addresses
     */
    this.uriPrefix = 'xkr://';

    /**
     * How often to save the wallet, in milliseconds
     */
    this.walletSaveFrequency = 60 * 1000;

    /**
     * The amount of decimal places your coin has, e.g. TurtleCoin has two
     * decimals
     */
    this.decimalPlaces = 5;

    /**
     * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
     * In TurtleCoin, this converts to TRTL
     */
    this.addressPrefix = 2239254;

    /**
     * Request timeout for daemon operations in milliseconds
     */
    this.requestTimeout = 10 * 1000;

    /**
     * The block time of your coin, in seconds
     */
    this.blockTargetTime = 90;

    /**
     * How often to process blocks, in millseconds
     */
    this.syncThreadInterval = 4;

    /**
     * How often to update the daemon info, in milliseconds
     */
    this.daemonUpdateInterval = 10 * 1000;

    /**
     * How often to check on locked transactions
     */
    this.lockedTransactionsCheckInterval = 10 * 1000;

    /**
     * The amount of blocks to process per 'tick' of the mainloop. Note: too
     * high a value will cause the event loop to be blocked, and your interaction
     * to be laggy.
     */
    this.blocksPerTick = 100;

    /**
     * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TRTL
     */
    this.ticker = 'XKR';

    /**
     * Most people haven't mined any blocks, so lets not waste time scanning
     * them
     */
    this.scanCoinbaseTransactions = false;

    /**
     * The minimum fee allowed for transactions, in ATOMIC units
     */
    this.minimumFee = 10;

    /**
     * Mapping of height to mixin maximum and mixin minimum
     */
    this.mixinLimits = new MixinLimits([
        /* Height: 440,000, minMixin: 0, maxMixin: 100, defaultMixin: 3 */
        new MixinLimit(440000, 0, 100, 3),

        /* At height of 620000, static mixin of 7 */
        new MixinLimit(620000, 7),

        /* At height of 800000, static mixin of 3 */
        new MixinLimit(800000, 3),
    ], 3 /* Default mixin of 3 before block 440,000 */);

    /**
     * The length of a standard address for your coin
     */
    this.standardAddressLength = 99;

    /**
     * The length of an integrated address for your coin - It's the same as
     * a normal address, but there is a paymentID included in there - since
     * payment ID's are 64 chars, and base58 encoding is done by encoding
     * chunks of 8 chars at once into blocks of 11 chars, we can calculate
     * this automatically
     */
    this.integratedAddressLength = 99 + ((64 * 11) / 8);

    /**
     * Use our native func instead of JS slowness
     */
    this.derivePublicKey = Platform.OS === 'ios' ? undefined : derivePublicKey;

    /**
     * Use our native func instead of JS slowness
     */
    this.generateKeyDerivation = Platform.OS === 'ios' ? undefined : generateKeyDerivation;

    /**
     * Use our native func instead of JS slowness
     */
    this.generateRingSignatures = Platform.OS === 'ios' ? undefined : generateRingSignatures;

    /**
     * Use our native func instead of JS slowness
     */
    this.deriveSecretKey = Platform.OS === 'ios' ? undefined : deriveSecretKey;

    /**
     * Use our native func instead of JS slowness
     */
    this.generateKeyImage = Platform.OS === 'ios' ? undefined : generateKeyImage;

    /**
     * Use our native func instead of JS slowness
     */
    this.checkRingSignatures = Platform.OS === 'ios' ? undefined: checkRingSignature;

    /**
     * Memory to use for storing downloaded blocks - 3MB
     */
    this.blockStoreMemoryLimit = 1024 * 1024 * 3;

    /**
     * Amount of blocks to request from the daemon at once
     */
    this.blocksPerDaemonRequest = 100;

    /**
     * Unix timestamp of the time your chain was launched.
     *
     * Note - you may want to manually adjust this. Take the current timestamp,
     * take away the launch timestamp, divide by block time, and that value
     * should be equal to your current block count. If it's significantly different,
     * you can offset your timestamp to fix the discrepancy
     */
    this.chainLaunchTimestamp = new Date(1557530788000);

    /**
     * Fee to take on all transactions, in percentage
     */
    this.devFeePercentage = 0;

    /**
     * Address to send dev fee to
     */
    this.devFeeAddress = 'SEKReZ4pekEQHXy6iNMfy5EpurwrVNKgJHuokcyPbdTgQ7UwPanewoC1PmoGDUiYrDB1yLemoLEjTR5yueGXN67TKFXYYhtRgBM';

    /**
     * Base url for price API
     *
     * The program *should* fail gracefully if your coin is not supported, or
     * you just set this to an empty string. If you have another API you want
     * it to support, you're going to have to modify the code in Currency.js.
     */
    this.priceApiLink = 'https://api.coinpaprika.com/v1/tickers/xkr-kryptokrona';

    /**
     * Default daemon to use. Can either be a BlockchainCacheApi(baseURL, SSL),
     * or a ConventionalDaemon(url, port).
     */
    this.defaultDaemon = new Daemon('gota.kryptokrona.se', 11898, false);

    /**
     * Default Hugin Cache to use.
     */
    this.defaultCache = 'https://cache.hugin.chat';

    /**
     * A link to where a bug can be reported for your wallet. Please update
     * this if you are forking, so we don't get reported bugs for your wallet...
     *
     */
    this.repoLink = 'https://github.com/kryptokrona/hugin-mobile/issues';

    /**
     * This only controls the name in the settings screen.
     */
    this.appName = 'Hugin Messenger';

    /**
     * Slogan phrase during wallet CreateScreen
     */
    this.sloganCreateScreen = 'A nordic cryptocurrency';

    /**
     * Displayed in the settings screen
     */
    this.appVersion = 'v1.1.2';

    /**
     * Base URL for us to chuck a hash on the end, and find a transaction
     */
    this.explorerBaseURL = 'https://explorer.kryptokrona.se/transaction.html?hash=';

    /**
     * A link to your app on the Apple app store. Currently blank because we
     * haven't released for iOS yet...
     */
    this.appStoreLink = '';

    /**
     * A link to your app on the google play store
     */
    this.googlePlayLink = 'https://play.google.com/store/apps/details?id=com.hugin';

    /**
     * A url to fetch node info from. Should follow the turtlepay format
     * detailed here: https://docs.turtlepay.io/blockapi/
     */
    this.nodeListURL = 'https://raw.githubusercontent.com/kryptokrona/kryptokrona-nodes-list/master/nodes.json';

    /**
    * A Url to fetch Hugin Caches from.
    */
    this.cacheListURL = 'https://raw.githubusercontent.com/kryptokrona/hugin-cache-list/main/apis.json';
};

module.exports = Config;
