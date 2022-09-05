// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import moment from 'moment';

import Moment from 'react-moment';

import 'moment/locale/de';
import 'moment/locale/sv';
import 'moment/locale/tr';
import 'moment/locale/zh-cn';
import 'moment/locale/nb';

import { Text, Platform, ToastAndroid, Alert } from 'react-native';

import { StackActions, NavigationActions } from 'react-navigation';

import {
    validateAddresses, WalletErrorCode, validatePaymentID, prettyPrintAmount,
} from 'kryptokrona-wallet-backend-js';

import * as Qs from 'query-string';

import Config from './Config';

import { Globals } from './Globals';

import { addFee, toAtomic } from './Fee';

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toastPopUp(message, short = true) {
    /* IOS doesn't have toast support */
    /* TODO */
    if (Platform.OS === 'ios') {
        return;
    }

    ToastAndroid.show(message, short ? ToastAndroid.SHORT : ToastAndroid.LONG);
}

/* Navigate to a route, resetting the stack, so the user cannot go back.
   We want to do this so when we go from the splash screen to the menu screen,
   the user can't return, and get stuck there. */
export function navigateWithDisabledBack(route, routeParams) {
    return StackActions.reset({
        index: 0,
        actions: [
            NavigationActions.navigate({
                routeName: route,
                params: routeParams,
            }),
        ]
    });
}

export function prettyPrintUnixTimestamp(timestamp) {
    return <Moment locale={Globals.language} element={Text} unix fromNow>{timestamp}</Moment>
}

export function prettyPrintDate2(timestamp) {
  let date = new Date(timestamp*1000);

  return date.toLocaleString(Globals.language);


}

export function prettyPrintDate(date) {
    if (date === undefined) {
        date = moment();
    }

    if (moment().year() === date.year()) {
        return date.format('D MMM, HH:mm');
    }

    return date.format('D MMM, YYYY HH:mm');
}

/**
 * Gets the approximate height of the blockchain, based on the launch timestamp
 */
export function getApproximateBlockHeight(date) {
    const difference = (date - Config.chainLaunchTimestamp) / 1000;

    let blockHeight = Math.floor(difference / 90);

    if (blockHeight < 0) {
        blockHeight = 0;
    }

    return blockHeight;
}

/**
 * Converts a date to a scan height. Note, takes a moment date.
 */
export function dateToScanHeight(date) {
    let jsDate = date.toDate();
    const now = new Date();

    if (jsDate > now) {
        jsDate = now;
    }

    return getApproximateBlockHeight(jsDate);
}

export function getArrivalTime(timeUnitTranslation) {
    const minutes = Config.blockTargetTime >= 60;

    if (minutes) {
        return Math.ceil(Config.blockTargetTime / 60) + ' ' + timeUnitTranslation[0];
    } else {
        return Config.blockTargetTime  + ' ' + timeUnitTranslation[1];
    }
}

export async function handleURI(data, navigation) {

  console.log(data);

    if (data.url ) {

      const params = Qs.parse(data.url.replace('xkr://', ''));

      if(params.board != undefined) {

              console.log(params.board);

              navigation.navigate(
                  'BoardsHome', {
                      board: params.board
                  });


              return;
      } else if (params.group != undefined) {

        // To do: Separate between a new group and a notification call

        const group_object = Globals.groups.filter(group => {
          return group.key == params.group;
        })

        console.log(group_object[0]);

          navigation.navigate(
              'GroupChatScreen', {
                  group: {group: group_object[0].group, key: group_object[0].key}
              });

              return;

      }

      if(params.istip != undefined) {

        const newPayee = {
            nickname: params.name,
            address: params.address,
            paymentID: params.paymentid
        }

        console.log(newPayee);
        const result = {
            payee: newPayee,
            suggestedAction: 'Transfer',
            valid: true,
        };

        console.log(params);
        console.log(result);
        if (!result.valid) {
            Alert.alert(
                'Cannot send transaction',
                result.error,
                [
                    {text: 'OK'},
                ]
            );
        } else {

            /* Hop into the transfer stack */
            navigation.navigate('ChoosePayee');
            // navigation.navigate('Recipients');
            /* Then navigate to the nested route, if needed */
            navigation.navigate('Transfer', {...result});
            return;
        }
      }

      const address = params.address;
      const name = params.name;

      if (name == undefined) {
        handleURI(data.url);
        return;
      }

      const paymentID = params.paymentID;

      navigation.navigate(
          'ChatScreen', {
              payee: {address: address, nickname: name, paymentID: paymentID},
          });

    } else if (!data.startsWith('xkr://SEKR')) {
      return;
    }

    const result = await parseURI(data);

    if (!result.valid) {
        Alert.alert(
            'Cannot send transaction',
            result.error,
            [
                {text: 'OK'},
            ]
        );
    } else {

        /* Hop into the transfer stack */
        navigation.navigate('ChoosePayee');
        // navigation.navigate('Recipients');
        /* Then navigate to the nested route, if needed */
        navigation.navigate(result.suggestedAction, {...result});
    }
}

export async function parseURI(qrData) {

    /* It's a URI, try and get the data from it */
    if (qrData.startsWith(Config.uriPrefix)) {
        /* Remove the turtlecoin:// prefix */
        let data = qrData.replace(Config.uriPrefix, '');
        let index = data.indexOf('?');

        /* Doesn't have any params */
        if (index === -1) {
            index = data.length;
        }

        const address = data.substr(0, index);
        const params = Qs.parse(data.substr(index));

        console.log(params);
        console.log(address);
        const amount = params.amount;
        const name = params.name;
        let paymentID = params.paymentid;

        if (paymentID) {
            const pidError = validatePaymentID(paymentID);

            /* Payment ID isn't valid. */
            if (pidError.errorCode !== WalletErrorCode.SUCCESS) {
                return {
                    valid: false,
                    error: 'QR Code is invalid',
                };
            }

            /* Both integrated address and payment ID given */
            if (address.length === Config.integratedAddressLength && paymentID.length !== 0) {
                return {
                    valid: false,
                    error: 'QR Code is invalid',
                };
            }
        }

        const addressError = await validateAddresses([address], true, Config);


        /* Address isn't valid */
        if (addressError.errorCode !== WalletErrorCode.SUCCESS) {
            return {
                valid: false,
                error: 'QR Code is invalid',
            };
        }

        const amountAtomic = Number(amount);

        /* No name, need to pick one.. */
        if (!name) {
            return {
                paymentID: paymentID || '',
                address,
                // amount: !isNaN(amountAtomic) ? amountAtomic : undefined,
                suggestedAction: 'NewPayee',
                valid: true,
            }
        }

        const newPayee = {
            nickname: name,
            address: address,
            paymentID: paymentID || '',
        }

        const existingPayee = Globals.payees.find((p) => p.nickname === name);

        /* Payee exists already */
        if (existingPayee) {
            /* New payee doesn't match existing payee, get them to enter a new name */
            if (existingPayee.address !== newPayee.address ||
                existingPayee.paymentID !== newPayee.paymentID) {
                return {
                    paymentID: paymentID || '',
                    address,
                    amount: amountAtomic,
                    suggestedAction: 'NewPayee',
                    valid: true,
                };
            }
        /* Save payee to database for later use */
        } else {
            Globals.addPayee(newPayee);
        }

        if (!amount) {
            return {
                payee: newPayee,
                suggestedAction: 'Transfer',
                valid: true,
            };
        } else {
            return {
                payee: newPayee,
                amount: amountAtomic,
                suggestedAction: 'Confirm',
                valid: true,
            };
        }
    /* It's a standard address, try and parse it (or something else) */
    } else {
        const addressError = validateAddresses([qrData], true, Config);

        if (addressError.errorCode !== WalletErrorCode.SUCCESS) {
            return {
                valid: false,
                error: 'QR code is invalid',
            };
        }

        return {
            valid: true,
            address: qrData,
            suggestedAction: 'NewPayee',
        }
    }
}

export function validAmount(amount, unlockedBalance) {
    if (amount === '' || amount === undefined || amount === null) {
        return [false, ''];
    }

    /* Remove commas in input */
    amount = amount.replace(/,/g, '');

    let numAmount = Number(amount);

    if (isNaN(numAmount)) {
        return [false, 'Amount is not a number!'];
    }

    /* Remove fractional component and convert to atomic */
    numAmount = Math.floor(toAtomic(numAmount));

    /* Must be above min send */
    if (numAmount < 1) {
        return [false, 'Amount is below minimum send!'];
    }

    if (numAmount > unlockedBalance) {
        return [false, 'Not enough funds available!'];
    }

    return [true, ''];
}
