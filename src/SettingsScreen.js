// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import * as _ from 'lodash';
import * as Animatable from 'react-native-animatable';

import React from 'react';
import TextTicker from 'react-native-text-ticker';
import { optimizeMessages } from './HuginUtilities';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import { Input } from 'react-native-elements';
import {
    Button, View, FlatList, Alert, Text, Linking, ScrollView, Platform, NativeModules,
    AppState, RefreshControl, useColorScheme
} from 'react-native';

import NetInfo from "@react-native-community/netinfo";

import { prettyPrintAmount, Daemon, WalletErrorCode } from 'kryptokrona-wallet-backend-js';

import Config from './Config';
import ListItem from './ListItem';
import List from './ListContainer';
import Constants from './Constants';

import { Styles } from './Styles';
import { Globals } from './Globals';
import { Authenticate } from './Authenticate';
import { SeedComponent, CopyButton } from './SharedComponents';
import { savePreferencesToDatabase, setHaveWallet } from './Database';

import {
    navigateWithDisabledBack, toastPopUp, getArrivalTime,
} from './Utilities';

export class FaqScreen extends React.Component {
    static navigationOptions = {
        title: 'FAQ',
    };

    constructor(props) {
        super(props);
    }

    render() {
        let arrivalTime = getArrivalTime();
        /* Chop the '!' off the end */
        arrivalTime = arrivalTime.substr(0, arrivalTime.length - 1);

        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
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
            </View>
        );
    }
}

export class DisableDozeScreen extends React.Component {
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
        let arrivalTime = getArrivalTime();
        /* Chop the '!' off the end */
        arrivalTime = arrivalTime.substr(0, arrivalTime.length - 1);

        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
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
                            ? 'Great! Doze is already disabled. You don\'t need to do anything else!'
                            : 'Doze is not yet disabled. Read on to find out how to disable it.'}
                    </Text>

                    <Text style={{
                        color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                        marginBottom: 20,
                        fontSize: 16,
                    }}>
                        Disabling Doze mode for {Config.appName} can help ensure your
                        wallet is always synced or nearly synced. Doze mode prevents
                        background syncing from firing consistently,
                        especially if you are not using your phone, to save battery.{'\n\n'}

                        To disable Doze mode, simply click the link below, then
                        select 'All Apps' from the dropdown.{'\n\n'}

                        Next, scroll down to find {Config.appName}, click it, then
                        choose 'Don't optimize'.{'\n\n'}

                        Click done, and you are finished!{'\n\n'}

                        <Text
                            style={{
                                color: '#3399ff',
                                fontSize: 16,
                            }}
                            onPress={() => NativeModules.TurtleCoin.navigateToBatteryOptimizationScreen()}
                        >
                            Click here to open the Battery optimization menu.
                        </Text>
                    </Text>
                </ScrollView>
            </View>
        );
    }
}


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
        return(
            <View style={{ backgroundColor: this.props.screenProps.theme.backgroundColour, flex: 1 }}>
                <ScrollView
                    ref={ref => this.scrollView = ref}
                    onContentSizeChange={(contentWidth, contentHeight) => {
                        this.scrollView.scrollToEnd({animated: true});
                    }}
                    style={{
                        marginTop: 50,
                        marginBottom: 10,
                        marginHorizontal: 10,
                        backgroundColor: this.props.screenProps.theme.backgroundColour,
                    }}
                >
                    {this.state.logs.map((value, index) => {
                        return(
                            <Text key={index} style={{ color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                                {value}
                            </Text>
                        );
                    })}
                </ScrollView>
            </View>
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

        return(
            <View style={{
                justifyContent: 'flex-start',
                flex: 1,
                backgroundColor: this.props.screenProps.theme.backgroundColour
            }}>
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
            </View>
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
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
                <List style={{
                    backgroundColor: this.props.screenProps.theme.backgroundColour,
                    marginTop: 50
                }}>
                    <FlatList
                        data={Constants.currencies}
                        keyExtractor={item => item.ticker}
                        renderItem={({item}) => (
                            <ListItem
                                title={item.coinName}
                                style={{borderBottomWidth: 0}}
                                subtitle={item.symbol + ' / ' + item.ticker.toUpperCase()}
                                leftIcon={
                                    <View style={{width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10}}>
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
                                    this.props.navigation.navigate('Main', { reloadBalance: true } );
                                }}
                            />
                        )}
                    />
                </List>
            </View>
        );
    }
}

export class SwapNodeScreen extends React.Component {
    static navigationOptions = {
        title: 'Available Nodes',
    };

    constructor(props) {
        super(props);

        this.refresh = this.refresh.bind(this);
        this.swapNode = this.swapNode.bind(this);

        this.state = {
            /* Sort by online nodes, then uptime (highest first), then fee
            * (lowest first), then name */
            nodes: _.orderBy(
                Globals.daemons,
                ['online',  'availability', 'fee.amount',   'name'],
                ['desc',    'desc',         'asc',          'asc']
            ),

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

        this.setState((prevState) => ({
            refreshing: false,

            nodes: _.orderBy(
                Globals.daemons,
                ['online',  'availability', 'fee.amount',   'name'],
                ['desc',    'desc',         'asc',          'asc']
            ),

            forceUpdate: prevState.forceUpdate + 1,
        }));
    }

    async swapNode(node) {
        toastPopUp('Swapping node...');

        Globals.preferences.node = node.url + ':' + node.port + ':' + node.ssl;

        this.setState((prevState) => ({
            selectedNode: Globals.preferences.node,
            forceUpdate: prevState.forceUpdate + 1,
        }));

        savePreferencesToDatabase(Globals.preferences);

        await Globals.wallet.swapNode(Globals.getDaemon());

        toastPopUp('Node swap complete.');
    }

    render() {
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
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
                            title='Updating node list...'
                        />
                    }
                >
                    {this.state.nodes.length > 0 ?
                        <List style={{
                            backgroundColor: this.props.screenProps.theme.backgroundColour,
                        }}>
                            <FlatList
                                extraData={this.state.forceUpdate}
                                data={this.state.nodes}
                                keyExtractor={(item) => item.url + item.port}
                                renderItem={({ item }) => (
                                    <ListItem
                                        title={item.name}
                                        subtitle={`Node TX fee: ${prettyPrintAmount(item.fee.amount, Config)}, Uptime: ${item.availability}%`}
                                        leftIcon={
                                            <View style={{
                                                width: 50,
                                                height: 50,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: this.props.screenProps.theme.iconColour,
                                                borderRadius: 45
                                            }}>
                                                <Text style={[Styles.centeredText, {
                                                    fontSize: 15,
                                                    color: item.online ? '#33ff33' : '#ff0000',
                                                }]}>
                                                    {item.online ? 'Online' : 'Offline'}
                                                </Text>
                                            </View>
                                        }
                                        titleStyle={{
                                            color: this.state.selectedNode === item.url + ':' + item.port
                                                ? this.props.screenProps.theme.primaryColour
                                                : this.props.screenProps.theme.slightlyMoreVisibleColour,
                                        }}
                                        subtitleStyle={{
                                            color: this.state.selectedNode === item.url + ':' + item.port
                                                ? this.props.screenProps.theme.primaryColour
                                                : this.props.screenProps.theme.slightlyMoreVisibleColour,
                                        }}
                                        onPress={async () => {
                                            if (!item.online) {
                                                Alert.alert(
                                                    'Use offline node?',
                                                    'Are you sure you want to attempt to connect to a node which is reporting as offline?',
                                                    [
                                                        {text: 'Yes', onPress: () => {
                                                            this.swapNode(item);
                                                        }},
                                                        {text: 'Cancel', style: 'cancel'},
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
                                Could not load nodes! Either the API is down, or you have no internet.
                                Pull-to-refresh to try and load the nodes again.
                            </Text>
                        </View>
                    }
                    <View style={{
                        backgroundColor: this.props.screenProps.theme.backgroundColour,
                        marginHorizontal: 20,
                    }}>
                    <Text style={{
                        fontSize: 20,
                        color: this.props.screenProps.theme.primaryColour,
                    }}>
                        Use a custom node by typing the address below
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: this.props.screenProps.theme.primaryColour,
                    }}>
                        Format is: url:port:ssl
                    </Text>
                    </View>
                    <Input
                        ref={this.state.input}
                        containerStyle={{
                            width: '100%',
                        }}
                        inputContainerStyle={{
                            backgroundColor: 'rgba(0,0,0,0.2)',
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
                              let node = {url: text[0], port: text[1], ssl: text[2]};

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
                </ScrollView>
            </View>
        );
    }
}

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
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
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
            </View>
        );
    }
}

/**
 * Fuck w/ stuff
 */
export class SettingsScreen extends React.Component {
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
        }
    }

    render() {
      let getColor = (item) => {
        switch(item.title) {
           case "FAQ":
              return "#5f86f2";
              break;
           case "Backup Keys":
              return "#a65ff2";
              break;
            case "View logs":
               return "#f25fd0";
               break;
           case "Rewind Wallet":
              return "#f25f61";
              break;
          case "Reset wallet":
             return "#f25f61";
             break;
           case "Speed Up Background Syncing":
              return "#f2cb5f";
              break;
          case "Swap Node":
             return "#abf25f";
             break;
         case "Swap Currency":
            return "#5ff281";
            break;
          case "Limit data":
             return "#5ff2f0";
             break;
           case "Enable dark mode":
              return "#5f86f2";
              break;
          case "Enable PIN/Fingerprint confirmation":
             return "#a65ff2";
             break;
             case "Change login method":
                return "#f25fd0";
                break;
                case "Enable Notifications":
                   return "#f25f61";
                   break;
                 case "Scan Coinbase Transactions":
                    return "#f2cb5f";
                    break;
                   case "Enable Auto Optimization":
                      return "#abf25f";
                      break;
                      case "Manually Optimize Wallet":
                         return "#5ff281";
                         break;
                         case "View Kryptokrona Mobile Wallet on Google Play":
                            return "#5ff2f0";
                            break;
                          case "View Kryptokrona Mobile Wallet on Github":
                             return "#5f86f2";
                             break;
                            case "Resync Wallet":
                               return "#a65ff2";
                               break;
                               case "Delete Wallet":
                                  return "#f25fd0";
                                  break;
                                  case "Kryptokrona Mobile Wallet":
                                     return "#f25f61";
                                     break;
                             default:
                             return this.props.screenProps.theme.foregroundColour


        }
      }
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                borderColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
                borderWidth: 0
            }}>
                <List style={{
                    backgroundColor: this.props.screenProps.theme.backgroundColour,
                    borderColor: this.props.screenProps.theme.backgroundColour,
                    borderWidth: 0,

                }}>
                    <FlatList
                        ItemSeparatorComponent={null}
                        data={[
                            // {
                            //     title: 'FAQ',
                            //     description: 'Find answers to common questions',
                            //     icon: {
                            //         iconName: 'question',
                            //         IconType: SimpleLineIcons,
                            //     },
                            //     onClick: () => {
                            //         this.props.navigation.navigate('Faq');
                            //     },
                            // },
                            {
                                title: 'Backup Keys',
                                description: 'Display your private keys/seed',
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
                                title: 'View logs',
                                description: 'View debugging information',
                                icon: {
                                    iconName: 'note-text',
                                    IconType: MaterialCommunityIcons,
                                },
                                onClick: () => {
                                    this.props.navigation.navigate('Logging');
                                },
                            },
                            {
                                title: 'Rewind Wallet',
                                description: 'Rescan last 5000 blocks for missing transactions',
                                icon: {
                                    iconName: 'md-rewind',
                                    IconType: Ionicons,
                                },
                                onClick: () => {
                                    if (Globals.preferences.authConfirmation) {
                                        Authenticate(
                                            this.props.navigation,
                                            'to rewind your wallet',
                                            () => {
                                                this.props.navigation.navigate('Settings');
                                                rewindWallet(this.props.navigation);
                                            }
                                        );
                                    } else {
                                        rewindWallet(this.props.navigation);
                                    }
                                },
                            },
                            {
                                title: 'Speed Up Background Syncing',
                                description: 'Disable battery optimization to speed up background syncing',
                                icon: {
                                    iconName: 'battery-charging',
                                    IconType: MaterialCommunityIcons,
                                },
                                onClick: () => {
                                    this.props.navigation.navigate('DisableDoze');
                                }
                            },
                            {
                                title: 'Swap Node',
                                description: 'Use an alternative daemon to sync your wallet',
                                icon: {
                                    iconName: 'ios-swap',
                                    IconType: Ionicons,
                                },
                                onClick: () => {
                                    this.props.navigation.navigate('SwapNode')
                                },
                            },
                            {
                                title: 'Swap Currency',
                                description: 'Swap your wallet display currency',
                                icon: {
                                    iconName: 'currency-usd',
                                    IconType: MaterialCommunityIcons,
                                },
                                onClick: () => { this.props.navigation.navigate('SwapCurrency') },
                            },
                            {
                                title: 'Limit data',
                                description: 'Only sync when connected to WiFi',
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
                                        Globals.wallet.start();
                                    }

                                    toastPopUp(Globals.preferences.limitData ? 'Data limiting enabled' : 'Data limiting disabled');
                                    savePreferencesToDatabase(Globals.preferences);
                                },
                                checkbox: true,
                                checked: this.state.limitData,
                            },
                            // {
                            //     title: 'Enable dark mode',
                            //     description: 'Swap between light and dark mode',
                            //     icon: {
                            //         iconName: this.state.darkMode ? 'light-down' : 'light-up',
                            //         IconType: Entypo,
                            //     },
                            //     onClick: () => {
                            //         const newTheme = Globals.preferences.theme === 'darkMode' ? 'lightMode' : 'darkMode';
                            //
                            //         Globals.preferences.theme = newTheme;
                            //
                            //         this.setState({
                            //             darkMode: Globals.preferences.theme === 'darkMode',
                            //         });
                            //
                            //         /* Need to use a callback to setState() the
                            //            theme prop which is passed down to all
                            //            our components */
                            //         if (Globals.updateTheme) {
                            //             Globals.updateTheme();
                            //             Globals.update();
                            //         }
                            //
                            //         toastPopUp(Globals.preferences.theme === 'darkMode' ? 'Dark mode enabled' : 'Light mode enabled');
                            //         savePreferencesToDatabase(Globals.preferences);
                            //     },
                            //     checkbox: true,
                            //     checked: this.state.darkMode,
                            // },
                            {
                                title: 'Enable PIN/Fingerprint confirmation',
                                description: 'Require auth for sensitive operations',
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

                                        toastPopUp(Globals.preferences.authConfirmation ? 'Pin Confirmation Enabled' : 'Pin Confirmation Disabled');
                                        savePreferencesToDatabase(Globals.preferences);
                                    }
                                },
                                checkbox: true,
                                checked: this.state.authConfirmation,
                            },
                            {
                                title: 'Change login method',
                                description: 'Use Pin, Fingerprint, or No Security',
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
                                title: 'Enable Notifications',
                                description: 'Get notified when you are sent money',
                                icon: {
                                    iconName: 'ios-notifications',
                                    IconType: Ionicons,
                                },
                                onClick: () => {
                                    Globals.preferences.notificationsEnabled = !Globals.preferences.notificationsEnabled;

                                    this.setState({
                                        notifsEnabled: Globals.preferences.notificationsEnabled,
                                    });

                                    toastPopUp(Globals.preferences.notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled');
                                    savePreferencesToDatabase(Globals.preferences);
                                },
                                checkbox: true,
                                checked: this.state.notifsEnabled,
                            },
                            {
                                title: 'Scan Coinbase Transactions',
                                description: 'Enable this if you have solo mined',
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
                                    toastPopUp(Globals.preferences.scanCoinbaseTransactions ? 'Scanning Coinbase Transactions enabled' : 'Scanning Coinbase Transactions disabled');
                                    savePreferencesToDatabase(Globals.preferences);
                                },
                                checkbox: true,
                                checked: this.state.scanCoinbase,
                            },
                            {
                                title: 'Manually Optimize Wallet',
                                description: 'Split your balance into more inputs (See FAQ)',
                                icon: {
                                    iconName: 'refresh',
                                    IconType: SimpleLineIcons,
                                },
                                onClick: () => {
                                    // optimizeWallet(this.props.navigation);
                                    optimizeMessages(10);
                                },

                            },
                            // {
                            //     title: `View ${Config.appName} on ${Platform.OS === 'ios' ? 'the App Store' : 'Google Play'}`,
                            //     description: 'Leave a rating or send the link to your friends',
                            //     icon: {
                            //         iconName: Platform.OS === 'ios' ? 'app-store' : 'google-play',
                            //         IconType: Entypo,
                            //     },
                            //     onClick: () => {
                            //         const link = Platform.OS === 'ios' ? Config.appStoreLink : Config.googlePlayLink;
                            //
                            //         Linking.openURL(link)
                            //                .catch((err) => Globals.logger.addLogMessage('Failed to open url: ' + err));
                            //     },
                            // },
                            // {
                            //     title: `Find ${Config.appName} on Github`,
                            //     description: 'View the source code and give feedback',
                            //     icon: {
                            //         iconName: 'github',
                            //         IconType: AntDesign,
                            //     },
                            //     onClick: () => {
                            //         Linking.openURL(Config.repoLink)
                            //                .catch((err) => Globals.logger.addLogMessage('Failed to open url: ' + err))
                            //     },
                            // },
                            {
                                title: 'Resync Wallet',
                                description: 'Resync wallet from scratch',
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
                                title: 'Delete Wallet',
                                description: 'Delete your wallet',
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
                                title: 'Reset wallet',
                                description: 'Use this if you are having issues sending messages',
                                icon: {
                                    iconName: 'md-help-buoy',
                                    IconType: Ionicons,
                                },
                                onClick: () => {
                                    if (Globals.preferences.authConfirmation) {
                                        Authenticate(
                                            this.props.navigation,
                                            'to delete your wallet',
                                            () => {
                                                this.props.navigation.navigate('Settings');
                                                recoverWallet(this.props.navigation)
                                            }
                                        );
                                    } else {
                                        recoverWallet(this.props.navigation)
                                    }
                                },
                            },
                            // {
                            //     title: Config.appName,
                            //     description: Config.appVersion,
                            //     icon: {
                            //         iconName: 'info',
                            //         IconType: SimpleLineIcons,
                            //     },
                            //     onClick: () => {},
                            // },
                        ]}
                        keyExtractor={item => item.title}
                        renderItem={({item}) => (
                            <ListItem
                                title={item.title}
                                noBorder
                                subtitle={item.description}
                                style={{borderBottomWidth: 0,
                                  marginLeft: 25,
                                  marginRight: 25}}
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
                                    <View style={{borderBottomWidth: 0, color: 'magenta', width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10}}>
                                        <item.icon.IconType name={item.icon.iconName} size={25} color={getColor(item)}/>
                                    </View>
                                }
                                rightIcon={item.checkbox &&
                                    <View style={{borderBottomWidth: 0, width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10}}>
                                        <MaterialIcons name={item.checked ? 'check-box' : 'check-box-outline-blank'} size={25} color={this.props.screenProps.theme.primaryColour}/>
                                    </View>
                                }
                                onPress={item.onClick}
                            />
                        )}
                    />
                </List>
            </View>
        );
    }
}

/**
 *
 */
function deleteWallet(navigation) {
    Alert.alert(
        'Delete Wallet?',
        'Are you sure you want to delete your wallet? If your seed is not backed up, your funds will be lost!',
        [
            {text: 'Delete', onPress: () => {
                (async () => {
                    /* Disabling saving */
                    clearInterval(Globals.backgroundSaveTimer);

                    await setHaveWallet(false);

                    Globals.wallet.stop();

                    Globals.reset();

                    /* And head back to the wallet choose screen */
                    navigation.navigate('Login');
                })();
            }},
            {text: 'Cancel', style: 'cancel'},
        ],
    );
}

function resetWallet(navigation) {
    Alert.alert(
        'Resync Wallet?',
        'Are you sure you want to resync your wallet? This may take a long time.',
        [
            {text: 'Resync', onPress: () => {
                Globals.wallet.rescan();
                toastPopUp('Wallet resync initiated');
                navigation.navigate('Main', { reloadBalance: true } );
            }},
            {text: 'Cancel', style: 'cancel'},
        ],
    );
}

function rewindWallet(navigation) {
    Alert.alert(
        'Rewind Wallet?',
        'Are you sure you want to rewind your wallet? This will take a little time.',
        [
            {text: 'Rewind', onPress: () => {
                const [ walletBlockCount ] = Globals.wallet.getSyncStatus();

                let rewindHeight = walletBlockCount;

                if (walletBlockCount > 5000) {
                    rewindHeight = walletBlockCount - 5000;
                }

                Globals.wallet.rewind(rewindHeight);

                toastPopUp('Wallet rewind initiated');
                navigation.navigate('Main', { reloadBalance: true } );
            }},
            {text: 'Cancel', style: 'cancel'},
        ],
    );
}

function recoverWallet(navigation) {
    Alert.alert(
        'Recover Wallet?',
        'This will make all current funds unavailable (but recoverable with your private keys).',
        [
            {text: 'Rewind', onPress: () => {
                const [ walletBlockCount ] = Globals.wallet.getSyncStatus();
                Globals.wallet.reset(walletBlockCount - 1);

                toastPopUp('Wallet recovery initiated');
                navigation.navigate('Main', { reloadBalance: true } );
            }},
            {text: 'Cancel', style: 'cancel'},
        ],
    );
}

function optimizeWallet(navigation) {
    Alert.alert(
        'Optimize Wallet?',
        'Are you sure you want to attempt to optimize your wallet? This may lock your funds for some time.',
        [
            {text: 'Optimize', onPress: () => {
                navigation.navigate('Optimize');
            }},
            {text: 'Cancel', style: 'cancel'},
        ],
    );
}
