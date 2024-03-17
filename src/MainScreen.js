// Copyright (C) 2018-2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React, { useState, useCallback } from "react";

import FontAwesome from 'react-native-vector-icons/FontAwesome5';

import * as Animatable from 'react-native-animatable';

import QRCode from 'react-native-qrcode-svg';
import NativeLinking from "react-native/Libraries/Linking/NativeLinking";
import PushNotification from 'react-native-push-notification';
import { NavigationActions, NavigationEvents, NavigationState } from 'react-navigation';

// import { useNavigation } from '@react-navigation/native';

import {
    TextInput, Animated, Button, Text, View, Image, ImageBackground, TouchableOpacity, PushNotificationIOS,
    AppState, Platform, Linking, ScrollView, RefreshControl, Dimensions, Clipboard
} from 'react-native';

import Identicon from 'identicon.js';

import NetInfo from "@react-native-community/netinfo";

import { prettyPrintAmount, LogLevel } from 'kryptokrona-wallet-backend-js';
import { Address } from 'kryptokrona-utils';

import Config from './Config';

import { Styles, unread_counter_style, unread_counter_text_style } from './Styles';
import { handleURI, toastPopUp, prettyPrintAmountMainScreen } from './Utilities';
import { getBestCache, cacheSync, cacheSyncDMs, getKeyPair, getMessage, getExtra, optimizeMessages, intToRGB, hashCode, get_avatar, sendMessage, sendNotifications } from './HuginUtilities';
import { ProgressBar } from './ProgressBar';
import { getKnownTransactions, deleteKnownTransaction, saveKnownTransaction, getUnreadMessages, boardsMessageExists, getBoardsMessage, savePreferencesToDatabase, saveToDatabase, loadPayeeDataFromDatabase } from './Database';
import { Globals, initGlobals, startWebsocket } from './Globals';
import { processBlockOutputs, makePostRequest } from './NativeCode';
import { initBackgroundSync } from './BackgroundSync';
import { CopyButton, OneLineText } from './SharedComponents';
import { coinsToFiat, getCoinPriceFromAPI } from './Currency';
import { withTranslation, Translation } from 'react-i18next';
import './i18n.js';
import i18next from './i18n'
import { GroupsScreen } from './Groups';

import CustomIcon from './CustomIcon.js'
import { Input } from "react-native-elements/src";

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
    Globals.wallet.enableAutoOptimization(false);

    /* Remove any previously added listeners */
    Globals.wallet.removeAllListeners('incomingtx');
    Globals.wallet.removeAllListeners('transaction');
    Globals.wallet.removeAllListeners('createdtx');
    Globals.wallet.removeAllListeners('createdfusiontx');
    Globals.wallet.removeAllListeners('deadnode');
    Globals.wallet.removeAllListeners('heightchange');

    Globals.wallet.on('incomingtx', async (transaction) => {
        sendNotification(transaction);
        optimizeMessages(10);
        backgroundSave();
    });

    Globals.wallet.on('deadnode', () => {
       // toastPopUp(i18next.t('nodeOfflineWarning'), false);
    });

    Globals.wallet.setLoggerCallback((prettyMessage, message) => {
        Globals.logger.addLogMessage(message);
    });

    Globals.wallet.setLogLevel(LogLevel.ERROR);

    /* Don't launch if already started */
    if (Globals.backgroundSaveTimer === undefined) {
        Globals.backgroundSaveTimer = setInterval(backgroundSave, Config.walletSaveFrequency);
    }

    

    if (Globals.backgroundSyncMessagesTimer === undefined) {
      Globals.backgroundSyncMessagesTimer = setInterval(function() {
        backgroundSyncMessages(navigation);
        //cacheSync(false);

      }, 10000);
    }
    
    

    if (Globals.checkIfStuck === undefined) {
        Globals.checkIfStuck = setInterval(checkIfStuck, 5000);
    }
 

    /* Use our native C++ func to process blocks, provided we're on android */
    /* TODO: iOS support */
    if (Platform.OS === 'android') {
        Globals.wallet.setBlockOutputProcessFunc(processBlockOutputs);
    }

    initGlobals();
    getBestCache();

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

    NativeLinking.getInitialURL().then((url) => {
      if (url) {



        if (url.startsWith('xkr://chat/')) {

          const json_str = url.replace('xkr://chat/', '');



          const payee = JSON.parse(json_str);

          navigation.navigate(
              'ChatScreen', {
                  payee: payee,
              });

        } else {

          Globals.fromChat = true;
          handleURI(url, navigation);

        }


      }
    }).catch(err => console.error('An error occurred', err));

}

function handleNotification(notification) {

    if (notification.transaction != undefined) {
      return;
    }

    let payee = notification.userInfo;

    if (payee.address) {

      payee = new URLSearchParams(payee).toString();

      let url = 'xkr://'.replace('address=', '') + payee;

      Linking.openURL(url);

    } else if (payee.key) {

      let url = `xkr://?group=${payee.key}`;

      Linking.openURL(url);

    } else {

      let url = 'xkr://?board=' + payee;

      Linking.openURL(url);


    }

}

export async function sendNotification(transaction) {
    // /* Don't show notifications if disabled */

    console.log('WTFWTFWTF');

    let this_addr = await Address.fromAddress(Globals.wallet.getPrimaryAddress());

    let my_public_key = this_addr.spend.publicKey;

    let amount_received = transaction.transfers.get(my_public_key);

    let payments = [];

    let nbrOfTxs = amount_received / 100000;

    console.log('Receieved ', nbrOfTxs);

    if (nbrOfTxs < 1) {
      return;
    }
    console.log(transaction);
    console.log(transaction.paymentID);
    let isTip = await boardsMessageExists(transaction.paymentID);
    console.log('isTip', isTip);
    let tippedMsg;
    isTip = (isTip && transaction.paymentID != '');
    console.log('isTip2', isTip);
    if (isTip) {
      tippedMsg = await getBoardsMessage(transaction.paymentID);
    }
    console.log(tippedMsg);
    const title = (isTip ? 'Tip received' : 'Payment received');
    const message = (isTip ? `You just received a tip for your post "${tippedMsg[0].message}" in ${tippedMsg[0].board} worth ${nbrOfTxs} XKR` : `You just received ${nbrOfTxs} XKR`);

    PushNotification.localNotification({
        title: title,//'Incoming transaction received!',
        //message: `You were sent ${prettyPrintAmount(transaction.totalAmount(), Config)}`,
        message: message,
        data: JSON.stringify(transaction.hash),
        transaction: JSON.stringify(transaction.hash)
    });
}

/**
 * Sync screen, balance
 */
export class MainScreen extends React.PureComponent {
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
                height: 46,
                textAlignVertical: "bottom",
                backgroundColor: "#FF00FF",
                marginBottom: 5
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
            address: Globals.wallet.getPrimaryAddress(),
            messages: Globals.messages.length,
            group_messages: Globals.groupMessages.length,
            unreads: Globals.unreadMessages

        }

        this.updateBalance();

        init(this.props.navigation);

        Globals.navigation = this.props.navigation;
        console.log('Navigation set to', Globals.navigation)

        Globals.wallet.on('transaction', () => {
            this.updateBalance();
        });

        Globals.wallet.on('createdtx', () => {
            this.updateBalance();
            backgroundSave();
        });

        Globals.wallet.on('createdfusiontx', () => {
            this.updateBalance();
        });
        Globals.wallet.on('sync', () => {
            this.updateBalance();
        });

        Globals.updateBoardsFunctions.push(async () => {
          Globals.unreadMessages = await getUnreadMessages();
            this.setState({
                unreads: Globals.unreadMessages
            })
        });

        Globals.updatePayeeFunctions.push(async () => {
          Globals.unreadMessages = await getUnreadMessages();
            this.setState({
                unreads: Globals.unreadMessages
            })
        });

        Globals.updateGroupsFunctions.push(async () => {
          Globals.unreadMessages = await getUnreadMessages();
            this.setState({
                unreads: Globals.unreadMessages
            })
        });


    }


    async componentDidMount() {
       const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();


       this.setState({
           unlockedBalance,
           lockedBalance
       });


   }

    async updateBalance() {


        const tmpPrice = await getCoinPriceFromAPI();

        if (tmpPrice !== undefined) {
            Globals.coinPrice = tmpPrice;
        }

        const unreads = await getUnreadMessages();

        const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();

        const coinValue = await coinsToFiat(
            unlockedBalance + lockedBalance, Globals.preferences.currency
        );

        this.setState({
            unlockedBalance,
            lockedBalance,
            coinValue,
            unreads: unreads
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

        setInterval(async () => {
          this.updateBalance();
        }, 60000);

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

        this.setState({
            refreshing: false
        });
    }

    render() {

      const { t, i18n } = this.props;

          const cardStyle = {
            backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
            borderWidth: 1,
            borderColor: this.props.screenProps.theme.borderColour,
            borderRadius: 15,
            padding: 10,
            flexDirection: 'row',
            flex: 1,
            alignContent: 'center'
          }

        /* If you touch the address component, it will hide the other stuff.
           This is nice if you want someone to scan the QR code, but don't
           want to display your balance. */

           const interpolateColor =  this.animatedValue.interpolate({
           inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
           outputRange:['#5f86f2','#a65ff2','#f25fd0','#f25f61','#f2cb5f','#abf25f','#5ff281','#5ff2f0']
           })

           const unreadGroupsMessages = this.state.unreads.groups;
           const unreadPrivateMessages = this.state.unreads.pms;

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
                    height: Dimensions.get('window').height - 100,
                }}>
                    <View style={{
                      height: 50
                    }}>

                    </View>

                    <TouchableOpacity onPress={() => this.setState({ addressOnly: !this.state.addressOnly })}>
                    <View style={{ alignItems: 'center' }}>

                        <View style={{ minWidth: '80%', borderRadius: 15, borderWidth: 1, borderColor: this.props.screenProps.theme.borderColour, padding: 3, backgroundColor: this.props.screenProps.theme.backgroundEmphasis }}>
                        <Image
                          style={{width: 112, height: 112}}
                          source={{uri: get_avatar(this.state.address, 112)}}
                        />

                        <CopyButton
                            style={{position: "absolute", top: 25, right: 20}}
                            data={this.state.address + Buffer.from(getKeyPair().publicKey).toString('hex')}
                            name='Address'
                            {...this.props}
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
                        <Translation>
                        {
                          (t, { i18n }) => <Text>{t('nickname')}</Text>
                        }
                        </Translation>
                        </Text>
                        <View
                        style={{
                            // width: this.state.messageHasLength ? '80%' : '100%',
                              backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
                              borderWidth: 1,
                              borderColor: this.props.screenProps.theme.borderColour,
                              borderRadius: 15,
                              height: 50,
                              margin: '5%',
                              marginTop: 0
                          }}
                        >
                        <TextInput
                            multiline={false}
                            textAlignVertical={'top'}
                            ref={input => { this.input = input }}
                            style={{
                                color: this.props.screenProps.theme.primaryColour,
                                fontFamily: 'Montserrat-Regular',
                                fontSize: 15,
                                width: '100%',
                                height: '100%',
                                padding: 15,

                            }}
                            maxLength={24}
                            placeholder={Globals.preferences.nickname}
                            placeholderTextColor={'#ffffff'}
                            onSubmitEditing={async (e) => {
                              savePreferencesToDatabase(Globals.preferences);
                            }}
                            onChangeText={(text) => {
                                if (this.props.onChange) {
                                    this.props.onChange(text);
                                }
                                Globals.preferences.nickname = text;
                                savePreferencesToDatabase(Globals.preferences);
                            }}
                            errorMessage={this.props.error}
                        />
                        </View>
                      {this.state.addressOnly &&
                        <AddressComponentWithTranslation {...this.props}/>
                      }

                      </View>
                      </View>

                      <View style={{ display: this.state.addressOnly ? 'flex' : 'none', borderRadius: 5, borderWidth: 0, borderColor: this.props.screenProps.theme.borderColour, padding: 0, marginTop: 10, backgroundColor: 'transparent', alignItems: "center" }}>

                          <QRCode
                              value={'xkr://' + this.state.address + '?paymentid=' + Buffer.from(getKeyPair().publicKey).toString('hex')}
                              size={175}
                              backgroundColor={'transparent'}
                              color={this.props.screenProps.theme.qrCode.foregroundColour}
                          />
                      </View>
                    </TouchableOpacity>

                    <View style={{display: this.state.addressOnly ? 'none' : 'flex', flex: 1}}>
                    <TouchableOpacity
                    onPress={() => {
                      this.props.navigation.navigate('ChoosePayee', this.props.navigation);
                    }}>
                                            <Text style={{
                                    color: 'white',
                                    fontSize: 54,
                                    fontFamily: 'icomoon',
                                    textAlign: 'center', alignItems: 'center', marginTop: 5,
                                    position: 'absolute',
                                    left: 50,
                                    top: 39,
                                    zIndex: 999
                                }}>
                                    
                                </Text>
                        <BalanceComponent
                            unlockedBalance={this.state.unlockedBalance}
                            lockedBalance={this.state.lockedBalance}
                            coinValue={this.state.coinValue}
                            address={this.state.address}
                            {...this.props}
                        />
                        </TouchableOpacity>
                    </View>

                    {!this.state.addressOnly &&
                      <View style={{paddingLeft: '10%', paddingRight: '10%', flexDirection: 'row', marginTop: 45}}>

                      <TouchableOpacity style={cardStyle}
                      onPress={() => {
                        this.props.navigation.navigate('Groups', this.props.navigation);
                      }}>

                      {unreadGroupsMessages ? <View style={[unread_counter_style, {position: 'absolute', top: -5, right: 5, borderColor: '#171416'}]}><Text style={unread_counter_text_style}>{unreadGroupsMessages}</Text></View> : <></>}

                      <CustomIcon name='messages' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />

                      <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'left',
                        fontSize: 10,
                        marginLeft: 10,
                        marginTop: 5,
                        fontFamily: 'Montserrat-Bold'
                      }}>

                      <Translation>
                      {
                        (t, { i18n }) => <Text>{t('groups')}</Text>
                      }
                      </Translation>

                      {this.state.group_messages.length}

                      </Text>

                      </TouchableOpacity>

                      <View style={{width: 10}}></View>

                      <TouchableOpacity style={cardStyle}
                      onPress={() => {
                        this.props.navigation.navigate('Recipients', this.props.navigation);
                      }}>

                      {unreadPrivateMessages ? <View style={[unread_counter_style, {position: 'absolute', top: -5, right: 5, borderColor: '#171416'}]}><Text style={unread_counter_text_style}>{unreadPrivateMessages}</Text></View> : <></>}

                      <CustomIcon name='message' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />

                      <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'left',
                        fontSize: 10,
                        marginLeft: 10,
                        marginTop: 5,
                        fontFamily: 'Montserrat-Bold'
                      }}>

                      <Translation>
                      {
                        (t, { i18n }) => <Text>{t('messagesTitle')}</Text>
                      }
                      </Translation>

                      {this.state.messages.length}

                      </Text>

                      </TouchableOpacity>


                      </View>
                    }

                    <View style={{ opacity: this.state.addressOnly ? 0 : 100, flex: 1 }}>
                        <SyncComponent {...this.props}/>
                    </View>
                </View>
            </ScrollView>
        );
    }
}

/* Display address, and QR code */
class AddressComponent extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            address: Globals.wallet.getPrimaryAddress(),
        };
    }


    render() {
      const { t } = this.props;

        return(
                <View>
                <Text style={[Styles.centeredText, {
                    color: this.props.screenProps.theme.primaryColour,
                    textAlign: 'left',
                    fontSize: 10,
                    marginTop: 0,
                    marginRight: 20,
                    marginLeft: 20,
                    fontFamily: 'Montserrat-Bold'
                }]}>
                {t('paymentAddress')}
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
                      toastPopUp(this.state.address + t('copied'));
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
                   {t('messageKey')}
                  </Text>

                  <Text onPress={() => {
                      Clipboard.setString(Buffer.from(getKeyPair().publicKey).toString('hex'));
                      toastPopUp(Buffer.from(getKeyPair().publicKey).toString('hex') + t('copied'));
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
        );
    }
}

const AddressComponentWithTranslation = withTranslation()(AddressComponent)


/**
 * Balance component at top of screen
 */
class BalanceComponentNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            expandedBalance: false,
        };

        this.balanceRef = (ref) => this.balance = ref;
        this.valueRef = (ref) => this.value = ref;
    }


        componentWillMount() {
        }


            componentDidMount() {

              let flipFlop = false;

            }

    componentWillReceiveProps(nextProps) {
        if (nextProps.unlockedBalance !== this.props.unlockedBalance ||
            nextProps.lockedBalance !== this.props.lockedBalance) {
        }
    }

    render() {
        const {t} = this.props;
        const hasBalance = (this.props.unlockedBalance + this.props.lockedBalance > 0) ? true : false;
        const compactBalance = <OneLineText
                                     style={{textAlign: 'center', alignItems: 'center', marginTop: 5, marginLeft: 35, fontFamily: 'MajorMonoDisplay-Regular', fontWeight: 'bolder', color: this.props.lockedBalance === 0 ? 'white' : 'white', fontSize: 24}}
                                >

                                     {prettyPrintAmountMainScreen(this.props.unlockedBalance)}
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


        const OpenURLButton = () => {
          const handlePress = useCallback(async () => {

              // Opening the link with some app, if the URL scheme is "http" the web link should be opened
              // by some browser in the mobile
              await Linking.openURL('https://kryptokrona.org/en/faucet?address=' + this.props.address);

          });
          if (false) {
            return <Button title={'⛽' + t('topUp')} onPress={handlePress} />;
          } else {
            return <View style={{alignItems: 'center'}}></View>;
          }
        };

    //    const interpolateColor =  this.animatedValue.interpolate({
    //    inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
    //    outputRange:['#5f86f2','#a65ff2','#f25fd0','#f25f61','#f2cb5f','#abf25f','#5ff281','#5ff2f0']
    //  });



        return(
            <View style={{alignItems: 'center'}}>
            {/* <Animated.View */}
            <View style={{textAlign: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20, alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: this.props.screenProps.theme.borderColour, padding: 8, backgroundColor: this.props.screenProps.theme.backgroundEmphasis, minWidth: '80%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
  
                    <View style={{marginBottom: 8}}>
                    {this.state.expandedBalance ? expandedBalance : compactBalance}
                    </View>
                    </View>
                    {parseInt(this.props.lockedBalance) > 0 &&
                    <Text style={{color: 'white'}}>+ {prettyPrintAmount(this.props.lockedBalance, Config).slice(0,-4)}</Text>}


            <OpenURLButton></OpenURLButton>
<Text>
            {hasBalance &&
            <Text>{this.props.coinValue}</Text>
            }
            </Text>
            </View>
        );
    }
}

const BalanceComponent = withTranslation()(BalanceComponentNoTranslation)


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

async function checkIfStuck() {

  const [walletHeight, localHeight, networkHeight] = Globals.wallet.getSyncStatus();

  if (networkHeight == 0) {
    return;
  }

  if ( walletHeight == 0) {
    Globals.stuckTicks ? Globals.stuckTicks += 1 : Globals.stuckTicks = 1;

    if (Globals.stuckTicks > 3) {
        Globals.wallet.rewind(networkHeight-100);
    }

  } else {
    clearInterval(Globals.checkIfStuck);
    Globals.checkIfStuck = undefined;
  }



}

async function backgroundSyncMessages(navigation) {

    const syncingHasStalled = (Date.now() - Globals.lastSyncEvent > 1000 * 60 );

    if (syncingHasStalled ) Globals.syncingMessages = false;

    // Add check if websocket // cache is working
    if (Globals.preferences.cacheEnabled == "true") {

        try {
            const cacheURL = `${Globals.preferences.cache}/api/v1/info`;
            console.log('trying to get ', cacheURL);
            const resp = await fetch(cacheURL, {
            method: 'GET'
            }, 3000);
            if (!resp.ok) {
                Globals.APIOnline = false;
            } else {
                Globals.APIOnline = true;
            }
        } catch (e) {
        console.log(e);
        Globals.APIOnline = false;
        }
    }

    console.log('API is ', Globals.APIOnline);


    if (Globals.webSocketStatus == 'offline' && Globals.preferences.cacheEnabled == "true" && Globals.APIOnline && Globals.preferences.websocketEnabled == 'true') {
        startWebsocket();
        if (Globals.webSocketStatus == 'online' && Globals.websocketEnabled == 'true') return;
    }
    
    if (Globals.webSocketStatus == 'online' && Globals.initalSyncOccurred && Globals.websocketEnabled == 'true') {
        Globals.syncingMessages = false;
        return;
    }

    Globals.initalSyncOccurred = true;

  if (Globals.syncingMessages) {
    console.log('Already syncing.. skipping.');
    return;
  } else {
    console.log('Commencing message sync.', Globals.syncingMessages);
  }

  Globals.syncingMessages = true;

  if (Globals.preferences.cacheEnabled == "true" && Globals.APIOnline) {

    console.log('Syncing from API..');

    await cacheSync();
    await cacheSyncDMs();
    Globals.logger.addLogMessage(`Found ${Globals.notificationQueue.length} messages.. 💌`);
    sendNotifications();
    Globals.syncingMessages = false;
    Globals.knownTXs = await getKnownTransactions();
    return;

  }

  

  try {

    Globals.logger.addLogMessage('Syncing messages from node.. 💌');
    
      const daemonInfo = Globals.wallet.getDaemonConnectionInfo();
      let knownTXs = await getKnownTransactions();
      let nodeURL = `${daemonInfo.ssl ? 'https://' : 'http://'}${daemonInfo.host}:${daemonInfo.port}`;
        fetch(nodeURL + "/get_pool_changes_lite", {
        method: 'POST',
        body: JSON.stringify({
             knownTxsIds: knownTXs
         })
      })
      .then((response) => response.json())
      .then(async (json) => {


        for (transaction in json.deletedTxsIds) {
          deleteKnownTransaction(json.deletedTxsIds[transaction]);
        }
        let addedTxs = json.addedTxs;

        Globals.logger.addLogMessage(`Found ${addedTxs.length} new messages.. 💌`);

        let transactions = addedTxs;

        for (transaction in transactions) {

          try {

            Globals.logger.addLogMessage(`Trying to decrypt message ${transaction}/${addedTxs.length}.. 💌`);

            Globals.lastSyncEvent = Date.now();

          let thisExtra = transactions[transaction]["transactionPrefixInfo.txPrefix"].extra;

          let thisHash = transactions[transaction]["transactionPrefixInfo.txHash"];

          if (Globals.knownTXs.indexOf(thisHash) != -1) continue;


          if (thisExtra.length > 66) {

           
            try {
                let message = await getMessage(thisExtra, thisHash, navigation);
            } catch (err) {
                console.log(err);
            }
            saveKnownTransaction(thisHash);
            if (Globals.knownTXs.indexOf(thisHash) === -1) Globals.knownTXs.push(thisHash);

          } else {
            saveKnownTransaction(thisHash);
            if (Globals.knownTXs.indexOf(thisHash) === -1) Globals.knownTXs.push(thisHash);
            continue;
          }


        } catch (err) {
          continue;
        }

        }
        Globals.logger.addLogMessage(`Found ${Globals.notificationQueue.length} messages.. 💌`);
        
        sendNotifications();
        Globals.syncingMessages = false;
        Globals.knownTXs = await getKnownTransactions();



      });
} catch (err) {
  console.log('Message sync failed: ', err);
  Globals.syncingMessages = false;
}


}
