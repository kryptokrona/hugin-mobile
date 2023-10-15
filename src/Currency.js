// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

const request = require('request-promise-native');

import Config from './Config';
import Constants from './Constants';

import { Globals } from './Globals';

export async function getCoinPriceFromAPI() {

    let fiatPrice = 0;

    let i = 0;

    while (!fiatPrice && i < Config.priceApiLinks.length) {

    let uri = `${Config.priceApiLinks[i].url}`; 
    try {
        const data = await request({
            json: true,
            method: 'GET',
            timeout: Config.requestTimeout,
            url: uri,
        });
        let j = 0;
        let currentLevel = data;
        while (j < Config.priceApiLinks[i].path.length){
            currentLevel = currentLevel[Config.priceApiLinks[i].path[j]]; 
            j++;
        }
        const coinData = currentLevel;
        Globals.logger.addLogMessage('Updated coin price from API');
        Globals.logger.addLogMessage('PRICE:' + coinData);
        if (coinData) {
            return coinData;
        }
        
    } catch (error) {
        // return undefined;
    }
    i++;
    }
    Globals.logger.addLogMessage('Failed to get price from API.');
}

function getCurrencyTickers() {
    return Constants.currencies.map((currency) => currency.ticker).join('%2C');
}

export async function coinsToFiat(amount, currencyTicker) {
    /* Coingecko returns price with decimal places, not atomic */
    let nonAtomic = amount / (10 ** Config.decimalPlaces);

    let prices = Globals.coinPrice || 0;

    // for (const currency of Constants.currencies) {
        // if (currencyTicker === currency.ticker) {
            let converted = prices * nonAtomic;

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

            return "$" + convertedString

            // if (currency.symbolLocation === 'prefix') {
            //     return currency.symbol + convertedString;
            // } else {
            //     return convertedString + ' ' + currency.symbol;
            // }
    //     }
    // }

    Globals.logger.addLogMessage('Failed to find currency: ' + currencyTicker);

    return '';
}
