// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

const request = require('request-promise-native');

import Config from './Config';
import Constants from './Constants';

import { Globals } from './Globals';

export async function getCoinPriceFromAPI() {
    /* Note: Coingecko has to support your coin for this to work */
    let uri = `${Config.priceApiLink}?ids=${Config.coinName.toLowerCase()}&vs_currencies=${getCurrencyTickers()}`;

    try {
        const data = await request({
            json: true,
            method: 'GET',
            timeout: Config.requestTimeout,
            url: uri,
        });

        const coinData = data[Config.coinName.toLowerCase()];

        Globals.logger.addLogMessage('Updated coin price from API');

        return coinData;
    } catch (error) {
        Globals.logger.addLogMessage('Failed to get price from API: ' + error.toString());
        return undefined;
    }
}

function getCurrencyTickers() {
    return Constants.currencies.map((currency) => currency.ticker).join('%2C');
}

export async function coinsToFiat(amount, currencyTicker) {
    /* Coingecko returns price with decimal places, not atomic */
    let nonAtomic = amount / (10 ** Config.decimalPlaces);

    let prices = Globals.coinPrice || {};

    for (const currency of Constants.currencies) {
        if (currencyTicker === currency.ticker) {
            let converted = prices[currency.ticker] * nonAtomic;

            if (converted === undefined || isNaN(converted)) {
                return '';
            }

            let convertedString = converted.toString();

            /* Only show two decimal places if we've got more than '1' unit */
            if (converted > 1) {
                convertedString = converted.toFixed(2);
            } else {
                convertedString = converted.toFixed(8);
            }

            if (currency.symbolLocation === 'prefix') {
                return currency.symbol + convertedString;
            } else {
                return convertedString + ' ' + currency.symbol;
            }
        }
    }

    Globals.logger.addLogMessage('Failed to find currency: ' + currencyTicker);

    return '';
}
