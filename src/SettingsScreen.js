// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import * as _ from 'lodash';
import * as Animatable from 'react-native-animatable';
import CustomIcon from './CustomIcon.js'

import React from 'react';
import { optimizeMessages, getBestNode, getBestCache, resyncMessage24h } from './HuginUtilities';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import { Input } from 'react-native-elements';
import './i18n.js';
import { withTranslation } from 'react-i18next';
import i18next from './i18n';
import fetch from './fetchWithTimeout'
import PushNotification from 'react-native-push-notification';

import {
  Button, View, FlatList, Alert, Text, Linking, ScrollView, Platform, NativeModules,
  AppState, RefreshControl, Switch
} from 'react-native';

import NetInfo from "@react-native-community/netinfo";

import { WalletErrorCode } from 'kryptokrona-wallet-backend-js';

import Config from './Config';
import ListItem from './ListItem';
import List from './ListContainer';
import Constants from './Constants';

import { Globals } from './Globals';
import { Authenticate } from './Authenticate';
import { SeedComponent, CopyButton } from './SharedComponents';
import { savePreferencesToDatabase, setHaveWallet } from './Database';

import {
  navigateWithDisabledBack, toastPopUp, getArrivalTime,
} from './Utilities';
import { ScreenHeader, ScreenLayout } from './components';

export class FaqScreen extends React.Component {
  static navigationOptions = {
    title: 'FAQ',
  };

  constructor(props) {
    super(props);
  }

  render() {
    let arrivalTime = getArrivalTime(['minutes', 'seconds']);
    /* Chop the '!' off the end */
    arrivalTime = arrivalTime.substr(0, arrivalTime.length - 1);

    return (
      <ScreenLayout>
        <ScrollView contentContainerStyle={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
          style={{
            marginTop: 60,
            marginLeft: 30,
            marginRight: 15,
          }}>
          <Text style={{
            fontSize: 24,
            color: this.props.screenProps.theme.primaryColour,
            marginBottom: 5,
          }}>
            • Background Syncing
          </Text>

          <Text style={{
            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            marginBottom: 20,
          }}>
            The wallet does support background syncing, however, it may take some time before you notice this.{'\n\n'}
            Every 15 minutes, a background sync event is fired. (This is a limitation of the mobile platform){'\n\n'}
            After that, background syncing will continue for {Platform.OS === 'ios' ? '30 seconds' : '14 minutes'}, until the next background sync event is fired.{'\n\n'}
            However, depending upon your phone model, battery, and OS, these background syncs may occur later than expected, or not at all.{'\n\n'}
            To help the background syncing to fire a lot more regularly, ensure you have disabled doze mode.{' '}
            <Text
              style={{
                color: '#3399ff',
              }}
              onPress={() => this.props.navigation.navigate('DisableDoze')}
            >
              Click this link
            </Text>
            {' '}for instructions on this.{'\n\n'}
            For further information, see{' '}
            <Text
              style={{
                color: '#3399ff',
              }}
              onPress={() => Linking.openURL('https://dontkillmyapp.com/').catch((err) => Globals.logger.addLogMessage('Failed to open url: ' + err))}
            >
              https://dontkillmyapp.com/
            </Text>
          </Text>

          <Text style={{
            fontSize: 24,
            color: this.props.screenProps.theme.primaryColour,
            marginBottom: 5,
          }}>
            • Importing a wallet faster
          </Text>

          <Text style={{
            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            marginBottom: 20,
          }}>
            Sadly, phones are quite slow at syncing the blockchain, due to being less powerful than desktops.{'\n\n'}
            If you are wanting to import a wallet, there are a few ways we can speed this up.{'\n\n'}
            The easiest way is to sync your wallet on your PC, make a new wallet on your phone, and send all the funds to that wallet.{'\n\n'}
            If you want to keep the same address, then the process is a little more complicated.{'\n\n'}
            Send all your funds to yourself. You may need to optimize your wallet first, to do it all in one transaction.{'\n\n'}
            Note down the block height you sent the funds. Then, import your wallet, and choose 'Pick an exact block height' when importing.{'\n\n'}
            Finally, enter the block height that you sent all your funds to yourself. You should now see your full balance in your mobile wallet.
          </Text>

          <Text style={{
            fontSize: 24,
            color: this.props.screenProps.theme.primaryColour,
            marginBottom: 5,
          }}>
            • My balance disappeared
          </Text>

          <Text style={{
            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            marginBottom: 20,
          }}>
            If you can no longer see your balance or sync status, you probably accidentally tapped the QR code.{'\n\n'}
            Tap it again and your balance should reappear.{'\n\n'}
            This is intentional, so you can let someone scan your QR code, without revealing how much {Config.coinName} you have.
          </Text>

          <Text style={{
            fontSize: 24,
            color: this.props.screenProps.theme.primaryColour,
            marginBottom: 5,
          }}>
            • Why is my balance locked?
          </Text>

          <Text style={{
            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            marginBottom: 20,
          }}>
            When you send a transaction, part of your balance gets locked.{'\n\n'}
            This is because your balance is comprised of multiple 'chunks' of {Config.coinName}.{'\n\n'}
            It's similar to buying something with a $10 note, and getting back some change from the cashier.{'\n\n'}
            Don't worry, your balance should unlock once the transaction confirms. (Normally in {arrivalTime})
          </Text>

          <Text style={{
            fontSize: 24,
            color: this.props.screenProps.theme.primaryColour,
            marginBottom: 5,
          }}>
            • What is Auto Optimization?
          </Text>

          <Text style={{
            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            marginBottom: 20,
          }}>
            Auto Optimization, whenever necessary, sends fusion transactions, to keep your wallet optimized.
            As mentioned above, your wallet is comprised of multiple 'chunks' of {Config.coinName}.{'\n\n'}
            Optimizing combines the chunks into fewer, larger ones. This enables you to fit more funds in one transaction.{'\n\n'}
            This process will result in your balance occasionally being locked - this should only last for a few minutes
            while the fusion transactions get added to a block, depending on how unoptimized your wallet is.
          </Text>

        </ScrollView>
      </ScreenLayout>
    );
  }
}

export class DisableDozeScreenNoTranslation extends React.Component {
  static navigationOptions = {
    title: 'Disable Doze',
  };

  constructor(props) {
    super(props);

    this.updateDozeStatus = this.updateDozeStatus.bind(this);

    this.state = {
      dozeDisabled: false
    }
  }

  async updateDozeStatus() {
    const dozeDisabled = await NativeModules.TurtleCoin.isDozeDisabled();

    this.setState({
      dozeDisabled,
    });
  }

  componentDidMount() {
    this.updateDozeStatus();
    AppState.addEventListener('change', this.updateDozeStatus);
  }

  render() {
    let arrivalTime = getArrivalTime(['minutes', 'seconds']);
    /* Chop the '!' off the end */
    arrivalTime = arrivalTime.substr(0, arrivalTime.length - 1);

    const { t } = this.props;

    return (
      <ScreenLayout>
        <ScrollView contentContainerStyle={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
          style={{
            marginTop: 60,
            marginLeft: 30,
            marginRight: 15,
          }}>
          <Text
            style={{
              fontSize: 24,
              marginBottom: 20,
              color: this.state.dozeDisabled ? this.props.screenProps.theme.primaryColour : 'red'
            }}
          >
            {this.state.dozeDisabled
              ? t('dozeDisabled')
              : t('dozeEnabled')}
          </Text>

          <Text style={{
            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            marginBottom: 20,
            fontSize: 16,
          }}>

            {t('disableDozeText').replace(/{Config.appName}/g, Config.appName).replace(/{\n\n}/g, '\n\n')}

            <Text
              style={{
                color: '#3399ff',
                fontSize: 16,
              }}
              onPress={() => NativeModules.TurtleCoin.navigateToBatteryOptimizationScreen()}
            >
              {t('openBatteryMenu')}
            </Text>
          </Text>
        </ScrollView>
      </ScreenLayout>
    );
  }
}

export const DisableDozeScreen = withTranslation()(DisableDozeScreenNoTranslation)


export class LoggingScreen extends React.Component {
  static navigationOptions = {
    title: 'Logs',
  };

  constructor(props) {
    super(props);

    this.state = {
      logs: Globals.logger.getLogs(),
    }
  }

  tick() {
    this.setState({
      logs: Globals.logger.getLogs(),
    });
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 10000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <ScreenLayout>
        <ScrollView
          ref={ref => this.scrollView = ref}
          onContentSizeChange={(contentWidth, contentHeight) => {
            this.scrollView.scrollToEnd({ animated: true });
          }}
          style={{
            marginTop: 50,
            marginBottom: 100,
            marginHorizontal: 10,
            backgroundColor: this.props.screenProps.theme.backgroundColour,
          }}
        >
          {this.state.logs.map((value, index) => {
            return (
              <Text key={index} style={{ color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                {value}
              </Text>
            );
          })}
        </ScrollView>

        <CopyButton
          style={{ position: "absolute", bottom: 25, right: 20 }}
          data={JSON.stringify(this.state.logs)}
          name='Logs'
          {...this.props}
        />

      </ScreenLayout>
    );
  }
}

export class ExportKeysScreen extends React.Component {
  static navigationOptions = {
    title: '',
  };

  constructor(props) {
    super(props);

    const [privateSpendKey, privateViewKey] = Globals.wallet.getPrimaryAddressPrivateKeys();

    this.state = {
      privateSpendKey,
      privateViewKey,
    }
  }

  async componentDidMount() {
    const [mnemonicSeed, error] = await Globals.wallet.getMnemonicSeed();

    this.setState({
      mnemonicSeed,
    });
  }

  render() {
    const noSeedComponent =
      <Text style={{
        color: this.props.screenProps.theme.primaryColour,
        marginRight: 20,
        marginTop: 10,
        marginBottom: 20,
        fontSize: 16,
      }}>
        Your wallet isn't a mnemonic seed capable wallet. Not to worry though, your
        private keys will work just as well for restoring your wallet.
      </Text>;

    const seedComponent =
      <SeedComponent
        seed={this.state.mnemonicSeed}
        borderColour={this.props.screenProps.theme.primaryColour}
        {...this.props}
      />;

    return (
      <ScreenLayout>
        <ScrollView style={{
          flex: 1,
        }}>
          <View style={{
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            marginTop: 60,
            marginLeft: 30,
          }}>
            <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 10 }}>
              Mnemonic Seed:
            </Text>

            {this.state.mnemonicSeed === undefined ? noSeedComponent : seedComponent}
          </View>

          <View style={{
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            marginTop: 10,
            marginLeft: 30,
          }}>
            <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 10 }}>
              Private Spend Key:
            </Text>
            <View style={{
              marginTop: 10,
              marginRight: 30,
              borderWidth: 1,
              borderColor: this.props.screenProps.theme.primaryColour,
              padding: 10,
            }}>
              <Text style={{
                fontSize: 12,
                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
              }}>
                {this.state.privateSpendKey}
              </Text>

            </View>

            <CopyButton
              data={this.state.privateSpendKey}
              name='Private Spend Key'
              style={{ marginLeft: 0 }}
              {...this.props}
            />

          </View>

          <View style={{
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            marginTop: 10,
            marginLeft: 30,
          }}>
            <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 10 }}>
              Private View Key:
            </Text>
            <View style={{
              marginTop: 10,
              marginRight: 30,
              borderWidth: 1,
              borderColor: this.props.screenProps.theme.primaryColour,
              padding: 10,
            }}>
              <Text style={{
                fontSize: 12,
                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
              }}>
                {this.state.privateViewKey}
              </Text>

            </View>

            <CopyButton
              data={this.state.privateViewKey}
              name='Private View Key'
              style={{ marginLeft: 0 }}
              {...this.props}
            />

          </View>
        </ScrollView>
      </ScreenLayout>
    );
  }
}

export class SwapCurrencyScreen extends React.Component {
  static navigationOptions = {
    title: '',
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ScreenLayout>
        <List style={{
          backgroundColor: this.props.screenProps.theme.backgroundColour,
          marginTop: 50
        }}>
          <FlatList
            data={Constants.currencies}
            keyExtractor={item => item.ticker}
            renderItem={({ item }) => (
              <ListItem
                title={item.coinName}
                style={{ borderBottomWidth: 0 }}
                subtitle={item.symbol + ' / ' + item.ticker.toUpperCase()}
                leftIcon={
                  <View style={{ width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ fontSize: 25, color: this.props.screenProps.theme.primaryColour }}>
                      {item.symbol}
                    </Text>
                  </View>
                }
                titleStyle={{
                  color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                }}
                subtitleStyle={{
                  color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                }}
                onPress={() => {
                  Globals.preferences.currency = item.ticker;

                  savePreferencesToDatabase(Globals.preferences);

                  /* Reset this stack to be on the settings screen */
                  this.props.navigation.dispatch(navigateWithDisabledBack('Settings'));

                  /* And go back to the main screen. */
                  this.props.navigation.navigate('Main', { reloadBalance: true });
                }}
              />
            )}
          />
        </List>
      </ScreenLayout>
    );
  }
}

export class SwapLanguageScreen extends React.Component {
  static navigationOptions = {
    title: 'Language',
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ScreenLayout>
        <List style={{
          backgroundColor: this.props.screenProps.theme.backgroundColour,
          marginTop: 50,
          marginLeft: 10,
          marginRight: 10
        }}>
          <FlatList
            data={Constants.languages}
            keyExtractor={item => item.langCode}
            renderItem={({ item }) => (
              <ListItem
                title={item.language}
                style={{ borderBottomWidth: 0 }}
                subtitle={item.langCode}
                leftIcon={
                  <View style={{ width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ fontSize: 25, color: this.props.screenProps.theme.primaryColour }}>
                      {item.flag}
                    </Text>
                  </View>
                }
                titleStyle={{
                  color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                }}
                subtitleStyle={{
                  color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                }}
                onPress={() => {
                  Globals.preferences.language = item.langCode;

                  savePreferencesToDatabase(Globals.preferences);

                  /* Reset this stack to be on the settings screen */
                  this.props.navigation.dispatch(navigateWithDisabledBack('Settings'));

                  /* And go back to the main screen. */
                  this.props.navigation.navigate('Main', { reloadBalance: true });
                }}
              />
            )}
          />
        </List>
      </ScreenLayout>
    );
  }
}


class SwapNodeScreenNoTranslation extends React.Component {
  static navigationOptions = {
    title: 'Available Nodes'
  };

  constructor(props) {
    super(props);

    this.refresh = this.refresh.bind(this);
    this.swapNode = this.swapNode.bind(this);

    console.log('Globals.daemons', Globals.daemons);

    this.state = {
      /* Sort by online nodes, then uptime (highest first), then fee
      * (lowest first), then name */
      nodes: Globals.daemons,

      selectedNode: Globals.preferences.node,

      forceUpdate: 0,

      refreshing: false
    };
  }

  async refresh() {
    this.setState({
      refreshing: true,
    });

    await Globals.updateNodeList();

    // Create an array to store all fetch promises
    const fetchPromises = [];

    for (const node of Globals.daemons) {
      const nodeURL = `${node.ssl ? 'https://' : 'http://'}${node.url}:${node.port}/info`;
      const fetchPromise = fetch(nodeURL, { method: 'GET' })
        .then(response => {
          node.online = true;
          this.setState({
            nodes: Globals.daemons,
            forceUpdate: this.state.forceUpdate + 1,
          });
        })
        .catch(error => {
          // Handle errors here
          node.online = false;
          this.setState({
            nodes: Globals.daemons,
            forceUpdate: this.state.forceUpdate + 1,
          });
        });
      fetchPromises.push(fetchPromise);
    }

    // Wait for all fetch promises to resolve
    await Promise.all(fetchPromises);

    this.setState({
      refreshing: false,
      nodes: Globals.daemons,
      forceUpdate: this.state.forceUpdate + 1,
    });
  }

  async swapNode(node) {
    toastPopUp(i18next.t('swappingNode'));


    Globals.preferences.node = node.url + ':' + node.port + ':' + node.ssl;

    this.setState((prevState) => ({
      selectedNode: Globals.preferences.node,
      forceUpdate: prevState.forceUpdate + 1,
    }));

    savePreferencesToDatabase(Globals.preferences);

    await Globals.wallet.swapNode(Globals.getDaemon());

    toastPopUp(i18next.t('nodeSwapped'));
  }

  render() {

    const { t } = this.props;
    return (
      <ScreenLayout>
        <ScrollView
          style={{
            backgroundColor: this.props.screenProps.theme.backgroundColour,
            flex: 1,
            marginTop: 50,
          }}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.refresh}
              title={t('updatingNodes')}
            />
          }
        >

          <View style={{
            backgroundColor: this.props.screenProps.theme.backgroundColour,
            marginHorizontal: 20,
          }}>
            <Text style={{
              fontSize: 20,
              textAlign: 'center',
              color: this.props.screenProps.theme.primaryColour,
            }}>
              {t('useCustomNode')}
            </Text>
            <Text style={{
              fontSize: 12,
              color: this.props.screenProps.theme.primaryColour,
              textAlign: 'center',
              marginBottom: 5
            }}>
              {t('customNodeFormat')}
            </Text>
          </View>
          <Input
            ref={this.state.input}
            containerStyle={{
              width: '100%',
            }}
            inputContainerStyle={{
              backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
              borderWidth: 0,
              borderColor: 'transparent',
              borderRadius: 15,
              width: '100%',
              height: 40,
              padding: 15
            }}
            inputStyle={{
              color: this.props.screenProps.theme.primaryColour,
              fontFamily: 'Montserrat-Regular',
              fontSize: 15
            }}
            placeholder={this.state.selectedNode}
            onSubmitEditing={async (e) => {
              // if (this.props.onChange) {
              //     this.props.onChange(text);
              // }
              let text = e.nativeEvent.text;
              text = text.split(':');
              let node = { url: text[0], port: text[1], ssl: text[2] };

              this.swapNode(node);
              // toastPopUp('Sending message: ' + text + " to " + this.state.address + " with msg key " + this.state.paymentID);
              // let updated_messages = await getMessages();
              // let temp_timestamp = Date.now();
              // updated_messages.push({
              //     conversation: this.state.address,
              //     type: 'sent',
              //     message: checkText(text),
              //     timestamp: temp_timestamp
              // });
              //
              // this.setState({
              //   messages: updated_messages
              // })
              // this.state.input.current.clear();
              //
              // let success = await sendMessage(checkText(text), this.state.address, this.state.paymentID);
              // await removeMessage(temp_timestamp);
              // if (success) {
              // let updated_messages = await getMessages();
              //
              //   this.setState({
              //     messages: updated_messages
              //   })
              //   // this.state.input.current.clear();
              // }
            }}
            onChangeText={(text) => {
              if (this.props.onChange) {
                this.props.onChange(text);
              }
            }}
            errorMessage={this.props.error}
          />
          <Text style={{
            fontSize: 20,
            color: this.props.screenProps.theme.primaryColour,
            textAlign: 'center'
          }}>
            {t('or')}
          </Text>
          <View
            style={{
              marginVertical: 20,
              marginHorizontal: 20,
              marginTop: 5
            }}
          >
            <Button
              title={t('autoSelectNode')}
              onPress={async () => {
                const best_node = await getBestNode();
                console.log('getBestNode', best_node);
                this.setState({
                  node: best_node,
                });
                this.swapNode(best_node);
              }}
              color={this.props.screenProps.theme.buttonColour}
              titleStyle={{
                color: this.props.screenProps.theme.primaryColour,
                fontSize: 13
              }}
              type="clear"
            />

          </View>

          {this.state.nodes.length > 0 ?

            <List style={{
              backgroundColor: this.props.screenProps.theme.backgroundColour,
              borderTopWidth: 0
            }}>
              <Text style={{
                fontSize: 20,
                color: this.props.screenProps.theme.primaryColour,
                textAlign: 'center',

              }}>
                {t('pickNodeList')}
              </Text>
              <Text style={{
                fontSize: 10,
                color: this.props.screenProps.theme.primaryColour,
                textAlign: 'center',
                marginBottom: 5
              }}>
                {t('pullToCheck')}
              </Text>
              <FlatList
                style={{ marginHorizontal: 20 }}
                extraData={this.state.forceUpdate}
                data={this.state.nodes}
                keyExtractor={(item) => item.url + item.port}
                renderItem={({ item }) => (
                  <ListItem
                    title={item.name}
                    subtitle={`URL: ${item.url + ':' + item.port} Fee: ${item.fee}/tx`}
                    leftIcon={
                      item.online == undefined ? <View style={{
                        width: 5,
                        height: 5,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#555555',
                        borderRadius: 45
                      }}>
                      </View> :
                        <View style={{
                          width: 5,
                          height: 5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: item.online ? '#33ff33' : '#ff0000',
                          borderRadius: 45
                        }}>
                        </View>
                    }
                    titleStyle={{
                      color: this.state.selectedNode === item.url + ':' + item.port + ":" + item.ssl
                        ? this.props.screenProps.theme.primaryColour
                        : this.props.screenProps.theme.slightlyMoreVisibleColour,
                    }}
                    subtitleStyle={{
                      color: this.state.selectedNode === item.url + ':' + item.port + ":" + item.ssl
                        ? this.props.screenProps.theme.primaryColour
                        : this.props.screenProps.theme.slightlyMoreVisibleColour,
                    }}
                    onPress={async () => {
                      if (!item.online) {
                        Alert.alert(
                          'Use offline node?',
                          'Are you sure you want to attempt to connect to a node which is reporting as offline?',
                          [
                            {
                              text: 'Yes', onPress: () => {
                                this.swapNode(item);
                              }
                            },
                            { text: 'Cancel', style: 'cancel' },
                          ],
                        );
                      } else {
                        this.swapNode(item);
                      }
                    }}
                  />
                )}
              />
            </List> :
            <View style={{
              backgroundColor: this.props.screenProps.theme.backgroundColour,
              marginHorizontal: 20,
            }}>
              <Text style={{
                fontSize: 20,
                color: this.props.screenProps.theme.primaryColour,
              }}>
                {t('noNodes')}
              </Text>
            </View>
          }

        </ScrollView>
      </ScreenLayout>
    );
  }
}
export const SwapNodeScreen = withTranslation()(SwapNodeScreenNoTranslation)

class SwapAPIScreenNoTranslation extends React.Component {
  static navigationOptions = {
    title: 'Available APIs'
  };

  constructor(props) {
    super(props);

    this.refresh = this.refresh.bind(this);
    this.swapAPI = this.swapAPI.bind(this);

    console.log(Globals.preferences.cache);
    console.log(Globals.preferences);

    this.state = {
      /* Sort by online nodes, then uptime (highest first), then fee
      * (lowest first), then name */
      apis: Globals.caches,

      selectedAPI: Globals.preferences.cache ? Globals.preferences.cache : Config.defaultCache,

      forceUpdate: 0,

      refreshing: false,

      enabled: Globals.preferences?.cacheEnabled == "true" ? true : false,

      autoPickCache: Globals.preferences?.autoPickCache == "true" ? true : false,

      websocketEnabled: Globals.preferences?.websocketEnabled == "true" ? true : false

    };
  }

  async componentDidMount() {
    await Globals.updateNodeList();
    this.setState({ apis: Globals.caches });
    console.log(this.state);
  }

  async refresh() {
    this.setState({
      refreshing: true,
    });

    await Globals.updateNodeList();

    // Create an array to store all fetch promises
    const fetchPromises = [];

    for (api in Globals.caches) {

      let this_api = Globals.caches[api];
      let nodeURL = this_api.url + '/api/v1/info';;
      const fetchPromise = fetch(nodeURL, { method: 'GET' })
        .then(response => {
          this_api.online = true;
          this.setState({
            apis: Globals.caches,
            forceUpdate: this.state.forceUpdate + 1,
          });
        })
        .catch(error => {
          // Handle errors here
          this_api.online = false;
          this.setState({
            apis: Globals.caches,
            forceUpdate: this.state.forceUpdate + 1,
          });
        });
      fetchPromises.push(fetchPromise);
    }

    // Wait for all fetch promises to resolve
    await Promise.all(fetchPromises);

    this.setState({
      refreshing: false,
      apis: Globals.caches,
      forceUpdate: this.state.forceUpdate + 1,
    });
  }

  async swapAPI(node) {
    toastPopUp(i18next.t('swappingAPI'));


    Globals.preferences.cache = node.url;

    this.setState((prevState) => ({
      selectedAPI: Globals.preferences.cache,
      forceUpdate: prevState.forceUpdate + 1,
    }));

    savePreferencesToDatabase(Globals.preferences);

    toastPopUp(i18next.t('APISwapped'));
  }

  render() {

    const { t } = this.props;
    return (
      <ScreenLayout>
        <View style={{ width: '100%', marginTop: 50, justifyContent: "center" }}>
          <View style={{ flexDirection: 'row' }}>
            <Switch
              value={this.state.enabled}
              onValueChange={(value) => {
                this.setState({
                  enabled: value
                });
                console.log(value);
                if (value) {
                  Globals.preferences.cacheEnabled = 'true';
                } else {
                  Globals.preferences.cacheEnabled = 'false';
                  Globals.APIOnline = false;
                }
                savePreferencesToDatabase(Globals.preferences);
              }}
              style={{ marginRight: 15 }}
            />
            <Text style={{
              fontSize: 15,
              color: this.props.screenProps.primaryColour,
              fontFamily: "Montserrat-Regular",
            }}>
              {t('enableAPI')}
            </Text>
          </View>
        </View>
        {this.state.enabled &&
          <>
            <View style={{ width: '100%', marginTop: 10, justifyContent: "center" }}>
              <View style={{ flexDirection: 'row' }}>
                <Switch
                  value={this.state.autoPickCache}
                  onValueChange={(value) => {
                    this.setState({
                      autoPickCache: value
                    });
                    console.log(value);
                    if (value) {
                      Globals.preferences.autoPickCache = 'true';
                    } else {
                      Globals.preferences.autoPickCache = 'false';
                    }
                    savePreferencesToDatabase(Globals.preferences);
                  }}
                  style={{ marginRight: 15 }}
                />
                <Text style={{
                  fontSize: 15,
                  color: this.props.screenProps.primaryColour,
                  fontFamily: "Montserrat-Regular",
                }}>
                  {t('autoPickAPI')}
                </Text>
              </View>
            </View>
            <View style={{ width: '100%', marginTop: 10, justifyContent: "center", }}>
              <View style={{ flexDirection: 'row', }}>
                <Switch
                  value={this.state.websocketEnabled}
                  onValueChange={(value) => {
                    this.setState({
                      websocketEnabled: value
                    });
                    console.log(value);
                    if (value) {
                      Globals.preferences.websocketEnabled = 'true';
                    } else {
                      Globals.preferences.websocketEnabled = 'false';
                    }
                    savePreferencesToDatabase(Globals.preferences);
                  }}
                  style={{ marginRight: 15 }}
                />
                <Text style={{
                  fontSize: 15,
                  color: this.props.screenProps.primaryColour,
                  fontFamily: "Montserrat-Regular",
                }}>
                  {t('enableWebsocket')}
                </Text>
              </View>
            </View>
          </>
        }
        {this.state.enabled &&

          <ScrollView
            style={{
              backgroundColor: this.props.screenProps.theme.backgroundColour,
              flex: 1,
              marginTop: 50,
            }}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this.refresh}
                title={t('updatingAPIs')}
              />
            }
          >

            <View style={{
              backgroundColor: this.props.screenProps.theme.backgroundColour,
              marginHorizontal: 20,
            }}>
              <Text style={{
                fontSize: 20,
                textAlign: 'center',
                color: this.props.screenProps.theme.primaryColour,
              }}>
                {t('useCustomAPI')}
              </Text>
              <Text style={{
                fontSize: 12,
                color: this.props.screenProps.theme.primaryColour,
                textAlign: 'center',
                marginBottom: 5
              }}>
                {t('customAPIFormat')}
              </Text>
            </View>
            <Input
              ref={this.state.input}
              containerStyle={{
                width: '100%',
              }}
              inputContainerStyle={{
                backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
                borderWidth: 0,
                borderColor: 'transparent',
                borderRadius: 15,
                width: '100%',
                height: 40,
                padding: 15
              }}
              inputStyle={{
                color: this.props.screenProps.theme.primaryColour,
                fontFamily: 'Montserrat-Regular',
                fontSize: 15
              }}
              placeholder={this.state.selectedAPI}
              onSubmitEditing={async (e) => {

                let text = e.nativeEvent.text;
                let api = { url: text };

                this.swapAPI(api);

              }}
              onChangeText={(text) => {
                if (this.props.onChange) {
                  this.props.onChange(text);
                }
              }}
              errorMessage={this.props.error}
            />
            <Text style={{
              fontSize: 20,
              color: this.props.screenProps.theme.primaryColour,
              textAlign: 'center'
            }}>
              {t('or')}
            </Text>
            <View
              style={{
                marginVertical: 20,
                marginHorizontal: 20,
                marginTop: 5
              }}
            >
              <Button
                title={t('autoSelectAPI')}
                onPress={async () => {
                  const best_api = await getBestCache();
                  this.setState({
                    api: best_api,
                  });
                  this.swapAPI(best_api);
                }}
                color={this.props.screenProps.theme.buttonColour}
                titleStyle={{
                  color: this.props.screenProps.theme.primaryColour,
                  fontSize: 13
                }}
                type="clear"
              />

            </View>

            {this.state.apis.length > 0 ?

              <List style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                borderTopWidth: 0
              }}>
                <Text style={{
                  fontSize: 20,
                  color: this.props.screenProps.theme.primaryColour,
                  textAlign: 'center',

                }}>
                  {t('pickAPIList')}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: this.props.screenProps.theme.primaryColour,
                  textAlign: 'center',
                  marginBottom: 5
                }}>
                  {t('pullToCheck')}
                </Text>
                <FlatList
                  style={{ marginHorizontal: 20 }}
                  extraData={this.state.forceUpdate}
                  data={this.state.apis}
                  keyExtractor={(item) => item.url}
                  renderItem={({ item }) => (
                    <ListItem
                      title={item.name}
                      subtitle={`URL: ${item.url}`}
                      leftIcon={
                        item.online == undefined ? <View style={{
                          width: 5,
                          height: 5,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#555555',
                          borderRadius: 45
                        }}>
                        </View> :
                          <View style={{
                            width: 5,
                            height: 5,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: item.online ? '#33ff33' : '#ff0000',
                            borderRadius: 45
                          }}>
                          </View>
                      }
                      titleStyle={{
                        color: this.state.selectedAPI === item.url
                          ? this.props.screenProps.theme.primaryColour
                          : this.props.screenProps.theme.slightlyMoreVisibleColour,
                      }}
                      subtitleStyle={{
                        color: this.state.selectedAPI === item.url
                          ? this.props.screenProps.theme.primaryColour
                          : this.props.screenProps.theme.slightlyMoreVisibleColour,
                      }}
                      onPress={async () => {
                        if (!item.online) {
                          Alert.alert(
                            'Use offline API?',
                            'Are you sure you want to attempt to connect to a API which is reporting as offline?',
                            [
                              {
                                text: 'Yes', onPress: () => {
                                  this.swapAPI(item);
                                }
                              },
                              { text: 'Cancel', style: 'cancel' },
                            ],
                          );
                        } else {
                          this.swapAPI(item);
                        }
                      }}
                    />
                  )}
                />
              </List> :
              <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                marginHorizontal: 20,
              }}>
                <Text style={{
                  fontSize: 20,
                  color: this.props.screenProps.theme.primaryColour,
                }}>
                  {t('noAPIs')}
                </Text>
              </View>
            }

          </ScrollView>

        }

      </ScreenLayout>
    );
  }
}
export const SwapAPIScreen = withTranslation()(SwapAPIScreenNoTranslation)

export class OptimizeScreen extends React.Component {
  static navigationOptions = ({ navigation, screenProps }) => ({
    title: 'Optimize Wallet',
  });

  constructor(props) {
    super(props);

    this.state = {
      sent: 0,
      completed: false,
      fullyOptimized: false,
    };

    this.optimize();
  }

  async optimize() {
    let failCount = 0;

    while (true) {
      const result = await Globals.wallet.sendFusionTransactionBasic();

      console.log(result.error);

      if (result.success) {
        this.setState((prevState) => {
          return {
            sent: prevState.sent + 1,
          };
        });

        failCount = 0;
      } else {
        console.log(result.error.errorCode);

        if (result.error.errorCode === WalletErrorCode.FULLY_OPTIMIZED) {
          this.setState({
            completed: true,
            fullyOptimized: true,
          });

          return;
        }

        if (failCount > 5) {
          this.setState({
            completed: true,
            error: result.error.toString(),
          });

          return;
        }

        failCount++;
      }
    }
  }

  render() {
    return (
      <ScreenLayout>
        <View style={{
          marginTop: 60,
          marginLeft: 30,
          marginRight: 30,
        }}>
          {!this.state.completed && <Animatable.Text
            style={{
              color: this.props.screenProps.theme.primaryColour,
              fontSize: 25,
            }}
            animation='pulse'
            iterationCount='infinite'
          >
            Optimizing wallet, please wait...
          </Animatable.Text>}

          {this.state.sent > 0 && !this.state.completed && <Text style={{ fontSize: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
            {`Sent ${this.state.sent} fusion transaction${this.state.sent >= 2 ? 's' : ''}.`}
          </Text>}

          {this.state.sent > 0 && this.state.completed && <Text style={{ fontSize: 20, marginTop: 10, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
            {`${this.state.sent} fusion transaction${this.state.sent >= 2 ? 's were' : ' was'} sent. It may take some time for ${this.state.sent >= 2 ? 'them' : 'it'} to be included in a block. Once this is complete, your balance will unlock for spending.`}
          </Text>}

          {this.state.completed && this.state.fullyOptimized && <Text style={{ fontSize: 20, marginTop: 10, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
            {this.state.sent > 0 ? 'Your wallet is now fully optimized!' : 'Wow, your wallet is already fully optimized! Nice!'}
          </Text>}

          {this.state.completed && !this.state.fullyOptimized && <Text style={{ fontSize: 20, marginTop: 10, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
            {`We were not able to completely optimize your wallet. Error sending fusion transaction: ${this.state.error}`}
          </Text>}
        </View>
      </ScreenLayout>
    );
  }
}

/**
 * Fuck w/ stuff
 */
export class SettingsScreenNoTranslation extends React.Component {
  static navigationOptions = ({ navigation, screenProps }) => ({
    title: 'Settings',
    header: null,
  });

  constructor(props) {
    super(props);

    this.state = {
      notifsEnabled: Globals.preferences.notificationsEnabled,
      scanCoinbase: Globals.preferences.scanCoinbaseTransactions,
      limitData: Globals.preferences.limitData,
      darkMode: Globals.preferences.theme === 'darkMode',
      authConfirmation: Globals.preferences.authConfirmation,
      autoOptimize: Globals.preferences.autoOptimize,
      language: Globals.preferences.language
    }
  }

  render() {
    const { t } = this.props;
    let getColor = (item) => {
      switch (item.title) {

        default:
          return this.props.screenProps.theme.foregroundColour
      }
    }

    return (
      <ScreenLayout>
        <ScreenHeader>
          {t('settingsTitle')}
        </ScreenHeader>
        <ScrollView
          showsVerticalScrollIndicator={false}>
          <FlatList
            ItemSeparatorComponent={null}
            data={[
              {
                title: t('backupKeys'),
                description: t('backupKeysDescr'),
                icon: {
                  iconName: 'key-change',
                  IconType: MaterialCommunityIcons,
                },
                onClick: () => {
                  if (Globals.preferences.authConfirmation) {
                    Authenticate(
                      this.props.navigation,
                      'to backup your keys',
                      () => {
                        this.props.navigation.dispatch(navigateWithDisabledBack('Settings'));
                        this.props.navigation.navigate('ExportKeys');
                      }
                    );
                  } else {
                    this.props.navigation.navigate('ExportKeys');
                  }
                },
              },
              {
                title: t('viewLogs'),
                description: t('viewLogsDescr'),
                icon: {
                  iconName: 'note-text',
                  IconType: MaterialCommunityIcons,
                },
                onClick: () => {
                  this.props.navigation.navigate('Logging');
                },
              },
              {
                title: t('backgroundSyncing'),
                description: t('backgroundSyncingDescr'),
                icon: {
                  iconName: 'battery-charging',
                  IconType: MaterialCommunityIcons,
                },
                onClick: () => {
                  this.props.navigation.navigate('DisableDoze');
                }
              },
              {
                title: t('swapNode'),
                description: t('swapNodeDescr'),
                icon: {
                  iconName: 'ios-swap',
                  IconType: Ionicons,
                },
                onClick: () => {
                  this.props.navigation.navigate('SwapNode')
                },
              },
              {
                title: t('swapAPI'),
                description: t('swapAPIDescr'),
                icon: {
                  iconName: 'ios-swap',
                  IconType: Ionicons,
                },
                onClick: () => {
                  this.props.navigation.navigate('SwapAPI')
                },
              },
              {
                title: t('limitData'),
                description: t('limitDataDescr'),
                icon: {
                  iconName: this.state.limitData ? 'signal-off' : 'signal',
                  IconType: MaterialCommunityIcons,
                },
                onClick: async () => {
                  Globals.preferences.limitData = !Globals.preferences.limitData;

                  this.setState({
                    limitData: Globals.preferences.limitData,
                  });

                  const netInfo = await NetInfo.fetch();

                  if (Globals.preferences.limitData && netInfo.type === 'cellular') {
                    Globals.wallet.stop();
                  } else {
                    Globals.wallet.enableAutoOptimization(false);
                    Globals.wallet.start();
                  }

                  toastPopUp(Globals.preferences.limitData ? t('dataLimitOn') : t('dataLimitOff'));
                  savePreferencesToDatabase(Globals.preferences);
                },
                checkbox: true,
                checked: this.state.limitData,
              },
              {
                title: t('enablePin'),
                description: t('enablePinDescr'),
                icon: {
                  iconName: 'security',
                  IconType: MaterialCommunityIcons,
                },
                onClick: () => {
                  /* Require pin to disable */
                  if (Globals.preferences.authConfirmation) {
                    Authenticate(
                      this.props.navigation,
                      'to disable PIN/Fingerprint confirmation',
                      () => {
                        Globals.preferences.authConfirmation = !Globals.preferences.authConfirmation;

                        this.props.navigation.navigate('Settings');

                        savePreferencesToDatabase(Globals.preferences);

                        this.setState({
                          authConfirmation: Globals.preferences.authConfirmation,
                        });
                      }
                    );
                  } else {
                    Globals.preferences.authConfirmation = !Globals.preferences.authConfirmation;

                    this.setState({
                      authConfirmation: Globals.preferences.authConfirmation,
                    });

                    toastPopUp(Globals.preferences.authConfirmation ? t('pinOn') : t('pinOff'));
                    savePreferencesToDatabase(Globals.preferences);
                    this.props.navigation.navigate('ChooseAuthMethod', {
                      nextRoute: 'Settings',
                    });

                  }
                },
                checkbox: true,
                checked: this.state.authConfirmation,
              },
              {
                title: t('changeLoginMethod'),
                description: t('changeLoginMethodDescr'),
                icon: {
                  iconName: 'security',
                  IconType: MaterialCommunityIcons,
                },
                onClick: () => {
                  this.props.navigation.navigate('ChooseAuthMethod', {
                    nextRoute: 'Settings',
                  });
                },
              },
              {
                title: t('enableNotifications'),
                description: t('enableNotificationsDescr'),
                icon: {
                  iconName: 'ios-notifications',
                  IconType: Ionicons,
                },
                onClick: () => {
                  Globals.preferences.notificationsEnabled = !Globals.preferences.notificationsEnabled;

                  this.setState({
                    notifsEnabled: Globals.preferences.notificationsEnabled,
                  });
                  toastPopUp(Globals.preferences.notificationsEnabled ? t('notifsOn') : t('notifsOff'));
                  if (Globals.preferences.notificationsEnabled) {
                    PushNotification.localNotification({
                      title: 'Test notification',
                      message: 'Notification\'s are enabled!',
                      data: ''
                    });
                  }
                  savePreferencesToDatabase(Globals.preferences);
                },
                checkbox: true,
                checked: this.state.notifsEnabled,
              },
              {
                title: t('scanCoinbase'),
                description: t('scanCoinbaseDescr'),
                icon: {
                  iconName: 'pickaxe',
                  IconType: MaterialCommunityIcons,
                },
                onClick: () => {
                  Globals.preferences.scanCoinbaseTransactions = !Globals.preferences.scanCoinbaseTransactions;

                  this.setState({
                    scanCoinbase: Globals.preferences.scanCoinbaseTransactions,
                  });

                  Globals.wallet.scanCoinbaseTransactions(Globals.preferences.scanCoinbaseTransactions);
                  toastPopUp(Globals.preferences.scanCoinbaseTransactions ? t('coinbaseOn') : t('coinbaseOff'));
                  savePreferencesToDatabase(Globals.preferences);
                },
                checkbox: true,
                checked: this.state.scanCoinbase,
              },
              {
                title: t('manualOptimization'),
                description: t('manualOptimizationDescr'),
                icon: {
                  iconName: 'refresh',
                  IconType: SimpleLineIcons,
                },
                onClick: async () => {
                  // optimizeWallet(this.props.navigation);
                  const result = await optimizeMessages(10, true);
                  if (result === true) {
                    toastPopUp(i18next.t('optimizationComplete'));
                  } else if (result === false) {
                    toastPopUp(i18next.t('optimizationFailed'));
                  } else if (result == 1) {
                    toastPopUp(i18next.t('alreadyOptimizing'));
                  } else {
                    toastPopUp(i18next.t('cancelOptimize').replace(/{inputs.length}/g, result));
                  }
                },

              },
              {
                title: t('resyncWallet'),
                description: t('resyncWalletDescr'),
                icon: {
                  iconName: 'ios-refresh',
                  IconType: Ionicons,
                },
                onClick: () => {
                  if (Globals.preferences.authConfirmation) {
                    Authenticate(
                      this.props.navigation,
                      'to resync your wallet',
                      () => {
                        this.props.navigation.navigate('Settings');
                        resetWallet(this.props.navigation);
                      }
                    );
                  } else {
                    resetWallet(this.props.navigation);
                  }
                },
              },
              {
                title: t('clearKnownMessages'),
                description: t('clearKnownMessagesDescr'),
                icon: {
                  iconName: 'messages',
                  IconType: CustomIcon,
                },
                onClick: () => {

                  resyncMessage24h();
                  toastPopUp('Resyncing messages from the past 24hrs..')

                },
              },
              {
                title: t('deleteWallet'),
                description: t('deleteWalletDescr'),
                icon: {
                  iconName: 'delete',
                  IconType: AntDesign,
                },
                onClick: () => {
                  if (Globals.preferences.authConfirmation) {
                    Authenticate(
                      this.props.navigation,
                      'to delete your wallet',
                      () => {
                        this.props.navigation.navigate('Settings');
                        deleteWallet(this.props.navigation)
                      }
                    );
                  } else {
                    deleteWallet(this.props.navigation)
                  }
                },
              },
              {
                title: `View ${Config.appName} on ${Platform.OS === 'ios' ? 'the App Store' : 'Google Play'}`,
                description: 'Leave a rating or send the link to your friends',
                icon: {
                  iconName: Platform.OS === 'ios' ? 'app-store' : 'google-play',
                  IconType: Entypo,
                },
                onClick: () => {
                  const link = Platform.OS === 'ios' ? Config.appStoreLink : Config.googlePlayLink;

                  Linking.openURL(link)
                    .catch((err) => Globals.logger.addLogMessage('Failed to open url: ' + err));
                },
              },
              {
                title: `Find ${Config.appName} on Github`,
                description: 'View the source code and give feedback',
                icon: {
                  iconName: 'github',
                  IconType: AntDesign,
                },
                onClick: () => {
                  Linking.openURL(Config.repoLink)
                    .catch((err) => Globals.logger.addLogMessage('Failed to open url: ' + err))
                },
              },
              {
                title: Config.appName,
                description: Config.appVersion,
                icon: {
                  iconName: 'info',
                  IconType: SimpleLineIcons,
                },
                onClick: () => { },
              },
            ]}
            keyExtractor={item => item.title}
            renderItem={({ item }) => (
              <ListItem
                title={item.title}
                noBorder
                subtitle={item.description}
                style={{
                  borderBottomWidth: 0,
                }}
                titleStyle={{
                  color: this.props.screenProps.theme.primaryColour,
                  borderBottomWidth: 0,
                  fontFamily: 'Montserrat-SemiBold'
                }}
                subtitleStyle={{
                  color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                  borderBottomWidth: 0,
                  fontFamily: 'Montserrat-Regular'
                }}
                leftIcon={
                  <View style={{ borderBottomWidth: 0, color: 'magenta', width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <item.icon.IconType name={item.icon.iconName} size={25} color={getColor(item)} />
                  </View>
                }
                rightIcon={item.checkbox &&
                  <View style={{ borderBottomWidth: 0, width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <MaterialIcons name={item.checked ? 'check-box' : 'check-box-outline-blank'} size={25} color={this.props.screenProps.theme.primaryColour} />
                  </View>
                }
                onPress={item.onClick}
              />
            )}
          />
        </ScrollView>
      </ScreenLayout>
    );
  }
}

export const SettingsScreen = withTranslation()(SettingsScreenNoTranslation)



/**
 *
 */
function deleteWallet(navigation) {
  Alert.alert(
    i18next.t('deleteWarningPromptTitle'),
    i18next.t('deleteWarningSubtitle'),
    [
      {
        text: i18next.t('delete'), onPress: () => {
          (async () => {
            /* Disabling saving */
            clearInterval(Globals.backgroundSaveTimer);

            clearInterval(Globals.backgroundSyncMessagesTimer);

            Globals.syncingMessages = false;

            Globals.backgroundSyncMessagesTimer = undefined;

            await setHaveWallet(false);

            Globals.wallet.stop();

            Globals.reset();

            /* And head back to the wallet choose screen */
            navigation.navigate('Login');
          })();
        }
      },
      { text: i18next.t('cancel'), style: 'cancel' },
    ],
  );
}

function resetWallet(navigation) {
  Alert.alert(
    i18next.t('resyncTitle'),
    i18next.t('resyncSubtitle'),
    [
      {
        text: i18next.t('resync'), onPress: () => {
          Globals.wallet.rescan();
          toastPopUp(i18next.t('resyncNotif'));
          navigation.navigate('Main', { reloadBalance: true });
        }
      },
      { text: i18next.t('cancel'), style: 'cancel' },
    ],
  );
}

function rewindWallet(navigation) {
  Alert.alert(
    i18next.t('rewindTitle'),
    i18next.t('rewindSubtitle'),
    [
      {
        text: i18next.t('rewind'), onPress: () => {
          const [walletBlockCount] = Globals.wallet.getSyncStatus();

          let rewindHeight = walletBlockCount;

          if (walletBlockCount > 5000) {
            rewindHeight = walletBlockCount - 5000;
          }

          Globals.wallet.rewind(rewindHeight);

          toastPopUp(i18next.t('rewindNotif'));
          navigation.navigate('Main', { reloadBalance: true });
        }
      },
      { text: i18next.t('cancel'), style: 'cancel' },
    ],
  );
}

function recoverWallet(navigation) {
  Alert.alert(
    i18next.t('recoverWalletTitle'),
    i18next.t('recoverWalletDescr'),
    [
      {
        text: i18next.t('ok'), onPress: () => {
          const [walletBlockCount] = Globals.wallet.getSyncStatus();
          Globals.wallet.reset(walletBlockCount - 1);

          toastPopUp('Wallet recovery initiated');
          navigation.navigate('Main', { reloadBalance: true });
        }
      },
      { text: i18next.t('cancel'), style: 'cancel' },
    ],
  );
}

function optimizeWallet(navigation) {
  Alert.alert(
    'Optimize Wallet?',
    'Are you sure you want to attempt to optimize your wallet? This may lock your funds for some time.',
    [
      {
        text: 'Optimize', onPress: () => {
          navigation.navigate('Optimize');
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ],
  );
}
