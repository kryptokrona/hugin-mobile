// Copyright (C) 2018-2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React, { useState } from "react";

import FontAwesome from 'react-native-vector-icons/FontAwesome5';

import * as Animatable from 'react-native-animatable';

import QRCode from 'react-native-qrcode-svg';

import PushNotification from 'react-native-push-notification';

import { NavigationActions, NavigationEvents } from 'react-navigation';

import {
    Animated, Text, View, Image, ImageBackground, TouchableOpacity, PushNotificationIOS,
    AppState, Platform, Linking, ScrollView, RefreshControl, Dimensions, Clipboard,
} from 'react-native';

import Identicon from 'identicon.js';

import NetInfo from "@react-native-community/netinfo";

import { prettyPrintAmount, LogLevel } from 'kryptokrona-wallet-backend-js';
import { Address } from 'kryptokrona-utils';

import Config from './Config';

import { Styles } from './Styles';
import { handleURI, toastPopUp } from './Utilities';
import { getKeyPair, getMessage, getExtra, optimizeMessages } from './HuginUtilities';
import { ProgressBar } from './ProgressBar';
import { saveToDatabase, loadPayeeDataFromDatabase } from './Database';
import { Globals, initGlobals } from './Globals';
import { processBlockOutputs, makePostRequest } from './NativeCode';
import { initBackgroundSync } from './BackgroundSync';
import { CopyButton, OneLineText } from './SharedComponents';
import { coinsToFiat, getCoinPriceFromAPI } from './Currency';

import {intToRGB, hashCode, get_avatar} from './HuginUtilities';

String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


async function init(navigation) {
    Globals.wallet.scanCoinbaseTransactions(Globals.preferences.scanCoinbaseTransactions);
    Globals.wallet.enableAutoOptimization(Globals.preferences.autoOptimize);

    /* Remove any previously added listeners */
    Globals.wallet.removeAllListeners('incomingtx');
    Globals.wallet.removeAllListeners('transaction');
    Globals.wallet.removeAllListeners('createdtx');
    Globals.wallet.removeAllListeners('createdfusiontx');
    Globals.wallet.removeAllListeners('deadnode');
    Globals.wallet.removeAllListeners('heightchange');

    Globals.wallet.on('incomingtx', (transaction) => {
        sendNotification(transaction);
    });

    Globals.wallet.on('deadnode', () => {
        toastPopUp('Node may be offline, check the settings screen to swap nodes', false);
    });

    Globals.wallet.setLoggerCallback((prettyMessage, message) => {
        Globals.logger.addLogMessage(message);
    });

    Globals.wallet.setLogLevel(LogLevel.DEBUG);

    /* Don't launch if already started */
    if (Globals.backgroundSaveTimer === undefined) {
        Globals.backgroundSaveTimer = setInterval(backgroundSave, Config.walletSaveFrequency);
    }
    if (Globals.backgroundSyncMessagesTimer === undefined) {
        Globals.backgroundSyncMessagesTimer = setInterval(backgroundSyncMessages, 5000);
    }

    /* Use our native C++ func to process blocks, provided we're on android */
    /* TODO: iOS support */
    if (Platform.OS === 'android') {
        Globals.wallet.setBlockOutputProcessFunc(processBlockOutputs);
    }

    initGlobals();

    PushNotification.configure({
        onNotification: handleNotification,

        permissions: {
            alert: true,
            badge: true,
            sound: true,
        },

        popInitialNotification: true,

        requestPermissions: true,
    });

    const url = await Linking.getInitialURL();

    if (url) {
        handleURI(url, navigation);
    }
}

function handleNotification(notification) {
    notification.finish(PushNotificationIOS.FetchResult.NoData);
}

export async function sendNotification(transaction) {
    // /* Don't show notifications if disabled */
    // if (!Globals.preferences.notificationsEnabled) {
    //     return;
    // }
    //
    // /* Don't show notifications in foreground */
    // if (AppState.currentState !== 'background') {
    //     return;
    // }

    //console.log(Globals.wallet);
    //
    // //console.log(transaction);
    //
    // //console.log(transaction.transfers);
    //
    // //console.log(transaction.transfers[0]);


    let this_addr = await Address.fromAddress(Globals.wallet.getPrimaryAddress());

    let my_public_key = this_addr.spend.publicKey;

    let amount_received = transaction.transfers.get(my_public_key);

    let payments = [];

    let nbrOfTxs = amount_received / 10000;

    optimizeMessages(nbrOfTxs);

    // for (transfer in transaction.transfers)

    let extra = await getExtra(transaction.hash);



    let message = await getMessage(extra);

    // let messages = await getMessages();
    // Globals.logger.addLogMessage('MessagesDB: ' + JSON.stringify(messages));
    Globals.logger.addLogMessage('Received message: ' + JSON.stringify(message));

    let from = message.from;

    let payees = await loadPayeeDataFromDatabase();
            for (payee in payees) {

              if (payees[payee].address == from) {
                from = payees[payee].nickname;
              }

            }

    PushNotification.localNotification({
        title: from,//'Incoming transaction received!',
        //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
        message: message.msg,
        data: JSON.stringify(transaction.hash),
        largeIconUrl: get_avatar(message.from, 64),
    });
}

/**
 * Sync screen, balance
 */
export class MainScreen extends React.Component {
    static navigationOptions = ({ navigation, screenProps }) => ({
        title: 'Home',
        tabBarOptions: {
            activeBackgroundColor: screenProps.theme.backgroundColour,
            inactiveBackgroundColor: screenProps.theme.backgroundColour,
            activeTintColor: screenProps.theme.primaryColour,
            inactiveTintColor: screenProps.theme.slightlyMoreVisibleColour,
            showLabel: false,
            style: {
                borderTopWidth: 0,
                height: 64,
                textAlignVertical: "top",
                backgroundColor: "#FF00FF",
                marginBottom: 33
            }
        }
    });

    constructor(props) {
        super(props);

        this.refresh = this.refresh.bind(this);
        this.handleURI = this.handleURI.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);
        this.handleNetInfoChange = this.handleNetInfoChange.bind(this);
        this.unsubscribe = () => {};



        this.state = {
            addressOnly: false,
            unlockedBalance: 0,
            lockedBalance: 0,
        }

        this.updateBalance();

        init(this.props.navigation);

        Globals.wallet.on('transaction', () => {
            this.updateBalance();
        });

        Globals.wallet.on('createdtx', () => {
            this.updateBalance();
        });

        Globals.wallet.on('createdfusiontx', () => {
            this.updateBalance();
        });
        Globals.wallet.on('heightchange', () => {
            this.updateBalance();
        });

    }

    async componentDidMount() {
       const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();

       this.setState({
           unlockedBalance,
           lockedBalance,
       });
   }

    async updateBalance() {
        const tmpPrice = await getCoinPriceFromAPI();

        if (tmpPrice !== undefined) {
            Globals.coinPrice = tmpPrice;
        }

        const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();

        const coinValue = await coinsToFiat(
            unlockedBalance + lockedBalance, Globals.preferences.currency
        );

        this.setState({
            unlockedBalance,
            lockedBalance,
            coinValue,
        });
    }

    handleURI(url) {
        handleURI(url, this.props.navigation);
    }

    async resumeSyncing() {
        const netInfo = await NetInfo.fetch();

        if (Globals.preferences.limitData && netInfo.type === 'cellular') {
            return;
        }

        /* Note: start() is a no-op when already started */
        Globals.wallet.start();
    }

    /* Update coin price on coming to foreground */
    async handleAppStateChange(appState) {
        if (appState === 'active') {
            this.updateBalance();
            this.resumeSyncing();
        }
    }

    async handleNetInfoChange({ type }) {
        if (Globals.preferences.limitData && type === 'cellular') {
            Globals.logger.addLogMessage("Network connection changed to cellular, and we are limiting data. Stopping sync.");
            Globals.wallet.stop();
        } else {
            /* Note: start() is a no-op when already started
             * That said.. it is possible for us to not want to restart here,
            * for example, if we are in the middle of a node swap. Need investigation */
            Globals.logger.addLogMessage("Network connection changed. Restarting sync process if needed.");
            Globals.wallet.start();
        }
    }

    componentWillMount() {
      this.animatedValue = new Animated.Value(0);
    }


    componentDidMount() {
        this.unsubscribe = NetInfo.addEventListener(this.handleNetInfoChange);
        AppState.addEventListener('change', this.handleAppStateChange);
        Linking.addEventListener('url', this.handleURI);
        initBackgroundSync();
        let flipFlop = false;

        let keepAnimating = () => {

          Animated.timing(this.animatedValue, {
            toValue: flipFlop ? 0 : 224,
            duration: 30000
          }).start(() => {
            flipFlop = flipFlop ? false : true;
            keepAnimating();
          });

        }

          Animated.timing(this.animatedValue, {
            toValue: 224,
            duration: 30000
          }).start(() => {
            keepAnimating();

      });
    }

    componentWillUnmount() {
        NetInfo.removeEventListener('connectionChange', this.handleNetInfoChange);
        AppState.removeEventListener('change', this.handleAppStateChange);
        Linking.removeEventListener('url', this.handleURI);
        this.unsubscribe();
    }

    async refresh() {
        this.setState({
            refreshing: true,
        });

        await this.updateBalance();

        this.setState({
            refreshing: false,
        });
    }

    render() {
        /* If you touch the address component, it will hide the other stuff.
           This is nice if you want someone to scan the QR code, but don't
           want to display your balance. */

           const interpolateColor =  this.animatedValue.interpolate({
           inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
           outputRange:['#5f86f2','#a65ff2','#f25fd0','#f25f61','#f2cb5f','#abf25f','#5ff281','#5ff2f0']
           })

        return(
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this.refresh}
                        title='Updating coin price...'
                    />
                }
                style={{
                    backgroundColor: this.props.screenProps.theme.backgroundColour,
                }}
                contentContainerstyle={{
                    flex: 1,
                }}
            >
                <NavigationEvents
                    onWillFocus={(payload) => {
                        if (payload && payload.action && payload.action.params && payload.action.params.reloadBalance) {
                            this.updateBalance();
                        }
                    }}
                />
                <View style={{
                    justifyContent: 'space-around',
                    height: Dimensions.get('window').height - 73,
                }}>
                    <View style={{
                      height: '10%',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 30,
                      padding: 0,
                      opacity: this.state.addressOnly ? 0 : 100,
                      shadowColor: "#000",
                      shadowOffset: {
                      	width: 0,
                      	height: 7,
                      },
                      shadowOpacity: 0.43,
                      shadowRadius: 9.51,

                      elevation: 15,
                    }}>
                    <View style={{flex: 1}}>
                        <BalanceComponent
                            unlockedBalance={this.state.unlockedBalance}
                            lockedBalance={this.state.lockedBalance}
                            coinValue={this.state.coinValue}
                            {...this.props}
                        />

                    </View>

                    </View>

                    <TouchableOpacity onPress={() => this.setState({ addressOnly: !this.state.addressOnly })}>
                        <AddressComponent {...this.props}/>
                    </TouchableOpacity>

                    <View style={{ opacity: this.state.addressOnly ? 0 : 100, flex: 1 }}>
                        <SyncComponent {...this.props}/>
                    </View>
                </View>
            </ScrollView>
        );
    }
}

/* Display address, and QR code */
class AddressComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            address: Globals.wallet.getPrimaryAddress(),
        };
    }

    render() {
        return(
            <View style={{ alignItems: 'center' }}>

                <View style={{ borderRadius: 5, borderWidth: 0, borderColor: this.props.screenProps.theme.borderColour, padding: 3, backgroundColor: this.props.screenProps.theme.qrCode.backgroundColour }}>
                <Image
                  style={{width: 112, height: 112}}
                  source={{uri: get_avatar(this.state.address, 112)}}
                />
                <Text style={[Styles.centeredText, {
                    color: this.props.screenProps.theme.primaryColour,
                    textAlign: 'left',
                    fontSize: 10,
                    marginTop: 0,
                    marginRight: 20,
                    marginLeft: 20,
                    fontFamily: 'Montserrat-Bold'
                }]}>
                Payment address
                </Text>
                  <Text numberOfLines={2} style={[Styles.centeredText, {
                      color: this.props.screenProps.theme.primaryColour,
                      width: 215,
                      fontSize: 15,
                      marginTop: 0,
                      marginRight: 20,
                      marginLeft: 20,
                      fontFamily: 'Montserrat-Regular'
                  }]} onPress={() => {
                      Clipboard.setString(this.state.address);
                      toastPopUp(this.state.address + ' copied');
                      }
                  }
                >
                        {this.state.address}
                  </Text>

                  <Text style={[Styles.centeredText, {
                      color: this.props.screenProps.theme.primaryColour,
                      textAlign: 'left',
                      fontSize: 10,
                      marginTop: 10,
                      marginRight: 20,
                      marginLeft: 20,
                      fontFamily: 'Montserrat-Bold'
                  }]}>
                  Message key
                  </Text>

                  <Text onPress={() => {
                      Clipboard.setString(Buffer.from(getKeyPair().publicKey).toString('hex'));
                      toastPopUp(Buffer.from(getKeyPair().publicKey).toString('hex') + ' copied');
                      }
                  } numberOfLines={2} style={[Styles.centeredText, {
                      color: this.props.screenProps.theme.primaryColour,
                      width: 215,
                      fontSize: 15,
                      marginTop: 0,
                      marginBottom: 5,
                      marginRight: 20,
                      marginLeft: 20,
                      fontFamily: 'Montserrat-Regular'
                  }]}>
                        {Buffer.from(getKeyPair().publicKey).toString('hex')}
                  </Text>


                </View>


                <CopyButton
                    data={this.state.address + Buffer.from(getKeyPair().publicKey).toString('hex')}
                    name='Address'
                    {...this.props}
                />

                <View style={{ borderRadius: 5, borderWidth: 0, borderColor: this.props.screenProps.theme.borderColour, padding: 0, marginTop: 10, backgroundColor: this.props.screenProps.theme.qrCode.backgroundColour }}>
                    <QRCode
                        value={'xkr://' + this.state.address + '?paymentid=' + Buffer.from(getKeyPair().publicKey).toString('hex')}
                        size={180}
                        backgroundColor={this.props.screenProps.theme.qrCode.backgroundColour}
                        color={this.props.screenProps.theme.qrCode.foregroundColour}
                    />
                </View>


            </View>
        );
    }
}

/**
 * Balance component at top of screen
 */
class BalanceComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            expandedBalance: false,
        };

        this.balanceRef = (ref) => this.balance = ref;
        this.valueRef = (ref) => this.value = ref;
    }



    componentWillReceiveProps(nextProps) {
        if (nextProps.unlockedBalance !== this.props.unlockedBalance ||
            nextProps.lockedBalance !== this.props.lockedBalance) {
            // this.balance.bounce(800);
        }
    }

    render() {
        const compactBalance = <OneLineText
                                     style={{textAlign: 'center', alignItems: 'center', marginTop: 5, fontFamily: 'MajorMonoDisplay-Regular', fontWeight: 'bolder', color: this.props.lockedBalance === 0 ? 'white' : 'white', fontSize: 32}}
                                     onPress={() => this.setState({
                                         expandedBalance: !this.state.expandedBalance
                                     })}
                                >

                                     {prettyPrintAmount(this.props.unlockedBalance + this.props.lockedBalance, Config).slice(0,-4)}
                               </OneLineText>;

        const lockedBalance = <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <FontAwesome name={'lock'} size={16} color={'white'} style={{marginRight: 7, marginTop: 0}}/>
                                    <OneLineText style={{ fontFamily: 'MajorMonoDisplay-Regular', color: 'white', fontSize: 25}}
                                          onPress={() => this.setState({
                                             expandedBalance: !this.state.expandedBalance
                                          })}>
                                        {prettyPrintAmount(this.props.lockedBalance, Config).slice(0,-4)}
                                    </OneLineText>
                              </View>;

        const unlockedBalance = <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <FontAwesome name={'unlock'} size={16} color={'white'} style={{marginRight: 7, marginTop: 3}}/>
                                    <OneLineText style={{ fontFamily: 'MajorMonoDisplay-Regular', color: 'white', fontSize: 25}}
                                          onPress={() => this.setState({
                                             expandedBalance: !this.props.expandedBalance
                                          })}>
                                        {prettyPrintAmount(this.props.unlockedBalance, Config).slice(0,-4)}
                                    </OneLineText>
                                </View>;

        const expandedBalance = <View style={{ textAlignVertical: 'middle', alignItems: 'center', justifyContent: 'center' }}>
                                    {unlockedBalance}
                                    {lockedBalance}
                                </View>;


        return(
            <View style={{ borderRadius: 5, borderWidth: 0, borderColor: this.props.screenProps.theme.borderColour, padding: 8, backgroundColor: this.props.screenProps.theme.qrCode.backgroundColour }}>

                    <View ref={this.balanceRef}>
                        {this.state.expandedBalance ? expandedBalance : compactBalance}
                    </View>

            </View>
        );
    }
}

/**
 * Sync status at bottom of screen
 */
class SyncComponent extends React.Component {
    constructor(props) {
        super(props);

        const [walletHeight, localHeight, networkHeight] = Globals.wallet.getSyncStatus();

        this.state = {
            walletHeight,
            localHeight,
            networkHeight,
            progress: 0,
            percent: '0.00',
        };

        this.updateSyncStatus = this.updateSyncStatus.bind(this);

        this.syncRef = (ref) => this.sync = ref;
    }

    updateSyncStatus(walletHeight, localHeight, networkHeight) {
        /* Since we update the network height in intervals, and we update wallet
           height by syncing, occasionaly wallet height is > network height.
           Fix that here. */
        if (walletHeight > networkHeight && networkHeight !== 0 && networkHeight + 10 > walletHeight) {
            networkHeight = walletHeight;
        }

        /* Don't divide by zero */
        let progress = networkHeight === 0 ? 100 : walletHeight / networkHeight;

        if (progress > 1) {
            progress = 1;
        }

        let percent = 100 * progress;

        /* Prevent bar looking full when it's not */
        if (progress > 0.97 && progress < 1) {
            progress = 0.97;
        }

        /* Prevent 100% when just under */
        if (percent > 99.99 && percent < 100) {
            percent = 99.99;
        } else if (percent > 100) {
            percent = 100;
        }

        const justSynced = progress === 1 && this.state.progress !== 1;

        this.setState({
            walletHeight,
            localHeight,
            networkHeight,
            progress,
            percent: percent.toFixed(2),
        }, () => { if (justSynced) { this.sync.bounce(800) } });
    }

    componentDidMount() {
        Globals.wallet.on('heightchange', this.updateSyncStatus);
    }

    componentWillUnmount() {
        if (Globals.wallet) {
            Globals.wallet.removeListener('heightchange', this.updateSyncStatus);
        }
    }

    render() {
        return(
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', bottom: 0, position: 'absolute', left: 0, right: 0 }}>
                <Animatable.Text ref={this.syncRef} style={{
                    fontFamily: 'Montserrat-Regular',
                    color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                }}>
                    {this.state.walletHeight} / {this.state.networkHeight} - {this.state.percent}%
                </Animatable.Text>
                <ProgressBar
                    progress={this.state.progress}
                    style={{justifyContent: 'flex-end', alignItems: 'center', width: 300, marginTop: 10}}
                    {...this.props}
                />
            </View>
        );
    }
}

/**
 * Save wallet in background
 */
async function backgroundSave() {
    Globals.logger.addLogMessage('Saving wallet...');

    try {
        await saveToDatabase(Globals.wallet);
        Globals.logger.addLogMessage('Save complete.');
    } catch (err) {
        Globals.logger.addLogMessage('Failed to background save: ' + err);
    }
}

async function backgroundSyncMessages() {
  // Globals.updatePayeeFunctions.push(() => {
  //     this.setState(prevState => ({
  //         payees: Globals.payees,
  //         index: prevState.index + 1,
  //     }))
  // });

    Globals.logger.addLogMessage('Getting unconfirmed transactions...');
      const daemonInfo = Globals.wallet.getDaemonConnectionInfo();
      let nodeURL = `${daemonInfo.ssl ? 'https://' : 'http://'}${daemonInfo.host}:${daemonInfo.port}`;
        fetch(nodeURL + "/get_pool_changes_lite", {
        method: 'POST',
        body: JSON.stringify({
             knownTxsIds: Globals.knownTXs
         })
      })
      .then((response) => response.json())
      .then(async (json) => {

        console.log(json);

        let addedTxs = json.addedTxs;

        // let json_string = JSON.stringify(json);
        //
        // //console.log('doc', json_string);
        //
        // let json_cleaned = json_string.replace(/.txPrefix/gi,'');
        //
        // //console.log('doc', json_cleaned);
        //
        // json_cleaned = JSON.parse(json_cleaned);
        //
        // //console.log('doc', json_cleaned);
        //
        // let transactions = json_cleaned.addedTxs;

        let transactions = addedTxs;

        console.log('transactions.length', transactions.length);
        console.log('Globals.knownTXs', Globals.knownTXs);
        for (transaction in transactions) {

          try {
            console.log(transactions[transaction]);
          let thisExtra = transactions[transaction]["transactionPrefixInfo.txPrefix"].extra;
          let thisHash = transactions[transaction]["transactionPrefixInfo.txHash"];
          if (Globals.knownTXs.indexOf(thisHash) === -1) {
                       Globals.knownTXs.push(thisHash);
                     } else {
                       console.log("This transaction is already known");
                       continue;
                     }
          console.log('Extra', thisExtra);

          if (thisExtra.length > 66) {


            let message = await getMessage(thisExtra);

            if (!message) {
              continue;
            }

            let from = message.from;

            let payees = await loadPayeeDataFromDatabase();
                    for (payee in payees) {

                      if (payees[payee].address == from) {
                        from = payees[payee].nickname;
                      }

                    }



          } else {
            console.log('no extra apparently');
          }

        } catch (err) {
          //console.log('Problem', err);
          continue;
        }

        }



      });


}
