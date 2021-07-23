// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import { WalletBackend } from 'kryptokrona-wallet-backend-js';

import { Animated, View, Alert } from 'react-native';

import Config from './Config';

import { Globals } from './Globals';
import { Spinner } from './Spinner';
import { FadeView } from './FadeView';
import { Authenticate } from './Authenticate';
import { haveWallet, loadWallet } from './Database';
import { delay, navigateWithDisabledBack } from './Utilities';

function fail(msg) {
    Globals.logger.addLogMessage(msg);

    Alert.alert(
        'Failed to open wallet',
        msg,
        [
            {text: 'OK'},
        ]
    );
}

/**
 * Called once the pin has been correctly been entered
 */
async function tryLoadWallet(navigation) {
    (async () => {
        /* Wallet already loaded, probably from previous launch, then
           sending app to background. */
        if (Globals.wallet !== undefined) {
            navigation.navigate('Home');
            return;
        }

        /* Load wallet data from DB */
        let [walletData, dbError] = await loadWallet();

        if (dbError) {
            await fail(dbError);
            return;
        }

        const [wallet, walletError] = await WalletBackend.loadWalletFromJSON(
            Globals.getDaemon(), walletData, Config
        );

        if (walletError) {
            await fail('Error loading wallet: ' + walletError);
        } else {
            Globals.wallet = wallet;
            navigation.navigate('Home');
        }
    })();
}

/**
 * Launch screen. See if the user has a pin, if so, request pin to unlock.
 * Otherwise, go to the create/import screen
 */
export class SplashScreen extends React.Component {
    static navigationOptions = {
        header: null,
    };

    constructor(props) {
        super(props);

        (async () => {
            /* See if user has previously made a wallet */
            const hasWallet = await haveWallet();

            /* Above operation takes some time. Loading animation is pretty ugly
               if it only stays for 0.5 seconds, and too slow if we don't have
               any animation at all..
               This way it looks nice, even if delaying interaction by a couple
               of seconds */
            await delay(2000);

            /* Get the pin, or show disclaimer then create a wallet if no pin */
            if (hasWallet) {
                Authenticate(
                    this.props.navigation,
                    'to unlock your wallet',
                    tryLoadWallet,
                    true
                );
            } else {
                this.props.navigation.dispatch(
                    navigateWithDisabledBack('WalletOption'),
                );
            }
        })();
    }


        componentWillMount() {
          this.animatedValue = new Animated.Value(0);
        }

        componentDidMount() {

            Animated.timing(this.animatedValue, {
              toValue: 224,
              duration: 3000
            }).start(() => {
          Animated.timing(this.animatedValue,{
            toValue:0,
            duration: 3000
          }).start()
        });
        }


    render() {

                 const interpolateColor =  this.animatedValue.interpolate({
                 inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
                 outputRange:['#5f86f2','#a65ff2','#f25fd0','#f25f61','#f2cb5f','#abf25f','#5ff281','#5ff2f0']
               });

        return(
            /* Fade in a spinner logo */
            <Animated.View style={{justifyContent: 'center', alignItems: 'stretch', backgroundColor: interpolateColor, flex: 1}}>

                    <Spinner/>

            </Animated.View>
        );
    }
}
