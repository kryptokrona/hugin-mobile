// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import { WalletBackend } from 'kryptokrona-wallet-backend-js';

import { View, Alert } from 'react-native';

import Config from './Config';

import { Globals } from './Globals';
import { Authenticate } from './Authenticate';
import { haveWallet, loadWallet } from './Database';
import { delay, navigateWithDisabledBack } from './Utilities';
import { XKRLogo } from './XKRLogo';

function fail(msg) {
  Globals.logger.addLogMessage(msg);

  Alert.alert(
    'Failed to open wallet',
    msg,
    [
      { text: 'OK' },
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
          'to unlock your account',
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

  }

  componentDidMount() {

  }


  render() {


    return (
      /* Fade in a spinner logo */
      <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: this.props.screenProps.theme.backgroundColour, flex: 1 }}>

        <XKRLogo />

      </View>
    );
  }
}
