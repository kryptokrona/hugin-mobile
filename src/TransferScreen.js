// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import * as Animatable from 'react-native-animatable';

import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import QRCodeScanner from 'react-native-qrcode-scanner';

import TextTicker from 'react-native-text-ticker';

import { HeaderButtons, HeaderButton, Item } from 'react-navigation-header-buttons';

import { HeaderBackButton, StackActions } from 'react-navigation';

import {
    validateAddresses, WalletErrorCode, validatePaymentID, prettyPrintAmount,
} from 'kryptokrona-wallet-backend-js';

import {
    View, Text, TextInput, TouchableWithoutFeedback, FlatList, Platform,
    ScrollView, Clipboard, Image
} from 'react-native';

import { Input, Button } from 'react-native-elements';

import Config from './Config';
import ListItem from './ListItem';
import List from './ListContainer';

import { Styles } from './Styles';
import { Globals } from './Globals';
import { Authenticate } from './Authenticate';
import { Hr, BottomButton } from './SharedComponents';
import { removeFee, toAtomic, fromAtomic, addFee } from './Fee';

import {
    getArrivalTime, navigateWithDisabledBack, delay, toastPopUp, handleURI,
    validAmount,
} from './Utilities';

import Identicon from 'identicon.js';

import './i18n.js';
import { withTranslation } from 'react-i18next';

const intToRGB = (int) => {

  if (typeof int !== 'number') throw new Error(errorMessage);
  if (Math.floor(int) !== int) throw new Error(errorMessage);
  if (int < 0 || int > 16777215) throw new Error(errorMessage);

  var red = int >> 16;
  var green = int - (red << 16) >> 8;
  var blue = int - (red << 16) - (green << 8);

  return {
    red: red,
    green: green,
    blue: blue
  }
}


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

const hashCode = (str) => {
		let hash = Math.abs(str.hashCode())*0.007812499538;
    return Math.floor(hash);

}

export class QrScannerScreen extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <QRCodeScanner
                    onRead={(code) => {
                        // this.props.navigation.goBack();

                        this.props.navigation.state.params.setAddress(code.data);
                    }}
                    cameraProps={{captureAudio: false}}
                />
            </View>
        );
    }
}

class AmountInput extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <Input
                containerStyle={{
                    width: '90%',
                    marginLeft: 20,
                    marginBottom: this.props.marginBottom || 0,
                }}
                inputContainerStyle={{
                    borderColor: this.props.screenProps.theme.notVeryVisibleColour,
                    borderWidth: 1,
                    borderRadius: 2,
                }}
                label={this.props.label}
                labelStyle={{
                    marginBottom: 5,
                    marginRight: 2,
                    color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                }}
                rightIcon={
                    <Text style={{
                        fontSize: this.props.fontSize || 30,
                        marginRight: 10,
                        color: this.props.screenProps.theme.primaryColour
                    }}
                >
                        {Config.ticker}
                    </Text>
                }
                keyboardType={'number-pad'}
                inputStyle={{
                    color: this.props.screenProps.theme.primaryColour,
                    fontSize: this.props.fontSize || 30,
                    marginLeft: 5
                }}
                errorMessage={this.props.errorMessage}
                value={this.props.value}
                onChangeText={(text) => this.props.onChangeText(text)}
            />
        );
    }
}

const CrossIcon = passMeFurther => (
    <HeaderButton {...passMeFurther} IconComponent={AntDesign} iconSize={23} color='red'/>
);

class CrossButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <HeaderButtons HeaderButtonComponent={CrossIcon}>
                <Item
                    title=''
                    iconName='close'
                    onPress={() => {
                        this.props.navigation.dispatch(StackActions.popToTop());
                        this.props.navigation.navigate('Main');
                    }}
                    buttonWrapperStyle={{ marginRight: 10 }}
                />
            </HeaderButtons>
        );
    }
}

/**
 * Send a transaction
 */
export class TransferScreenNoTranslation extends React.Component {
    static navigationOptions = ({ navigation, screenProps }) => {
        return {
            title: '',
            headerRight: (
                <CrossButton navigation={navigation}/>
            ),
        }
    };

    constructor(props) {
        super(props);

        this.state = {
            errMsg: '',
            continueEnabled: false,
            sendAll: false,
            amountFontSize: 30,
            unlockedBalance: 0,
            lockedBalance: 0,
            unlockedBalanceHuman: 0,
        }
    }

    async componentDidMount() {
        const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();

        this.setState({
            unlockedBalance,
            lockedBalance,
            unlockedBalanceHuman: fromAtomic(unlockedBalance),
        });

        this.interval = setInterval(() => this.tick(), 10000);
    }

    async tick() {
        const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();

        this.setState({
            unlockedBalance,
            lockedBalance,
            unlockedBalanceHuman: fromAtomic(unlockedBalance),
        });
    }

    checkErrors(amount) {
        if (this.state.sendAll) {
            if (this.state.unlockedBalance > 1) {
                this.setState({
                    continueEnabled: true,
                    amountAtomic: this.state.unlockedBalance,
                    errMsg: '',
                });
            } else {
                this.setState({
                    continueEnabled: false,
                    errMsg: 'Not enough funds available!',
                });
            }
        } else {
            const [valid, error] = validAmount(amount, this.state.unlockedBalance);

            this.setState({
                continueEnabled: valid,
                errMsg: error,
            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    flex: 1,
                    marginTop: 60,
                    backgroundColor: this.props.screenProps.theme.backgroundColour,
                }}>

                    <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                        marginBottom: 40,
                        marginLeft: 30,
                        fontFamily: 'Montserrat-SemiBold'
                    }}>
                        {t('transferTitle')}
                    </Text>

                    <AmountInput
                        label={t('sendAmountLabel')}
                        value={this.state.amount}
                        fontSize={this.state.amountFontSize}
                        onChangeText={(text) => {
                            this.setState({
                                amount: text,
                                amountAtomic: toAtomic(text),
                                sendAll: false,
                                amountFontSize: 30,
                            }, () => {
                                this.checkErrors(this.state.amount);
                            });
                        }}
                        errorMessage={this.state.errMsg}
                        {...this.props}
                    />

                    <View style={{ marginLeft: '70%' }}>
                        <Button
                            title={t('sendMaxButton')}
                            onPress={() => {
                                this.setState({
                                    sendAll: true,
                                    amount: t('sendAllLabel'),
                                    amountFontSize: 20,
                                }, () => {
                                    this.checkErrors(this.state.unlockedBalanceHuman);
                                });
                            }}
                            titleStyle={{
                                color: this.props.screenProps.theme.primaryColour,
                            }}
                            type="clear"
                        />
                    </View>

                    <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 18,
                        marginLeft: 30,
                        marginTop: 20,
                        fontFamily: 'Montserrat-Regular'
                    }}>
                        {t('shouldArriveIn')} {getArrivalTime([t('minute'), t('second')])}
                    </Text>

                    <BottomButton
                        title={t('continue')}
                        onPress={() => {
                            this.props.navigation.navigate(
                                'Confirm', {
                                    payee: this.props.navigation.state.params.payee,
                                    sendAll: this.state.sendAll,
                                    amount: this.state.amountAtomic,
                                }
                            );
                        }}
                        disabled={!this.state.continueEnabled}
                        {...this.props}
                    />

                </View>
            </View>
        );
    }
}
export const TransferScreen = withTranslation()(TransferScreenNoTranslation)

class AddressBook extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            payees: Globals.payees,
            index: 0,
        };

        Globals.updatePayeeFunctions.push(() => {
            this.setState(prevState => ({
                payees: Globals.payees,
                index: prevState.index + 1,
            }))
        });
    }

    render() {

                  function get_avatar(hash) {
                    // Displays a fixed identicon until user adds new contact address in the input field
                    if (hash.length < 15) {
                      hash = 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
                    }
                    // Get custom color scheme based on address
                    let rgb = intToRGB(hashCode(hash));

                    // Options for avatar
                    var options = {
                          foreground: [rgb.red, rgb.green, rgb.blue, 255],               // rgba black
                          background: [parseInt(rgb.red/10), parseInt(rgb.green/10), parseInt(rgb.blue/10), 0],         // rgba white
                          margin: 0.2,                              // 20% margin
                          size: 50,                                // 420px square
                          format: 'png'                           // use SVG instead of PNG
                        };

                    // create a base64 encoded SVG
                    return 'data:image/png;base64,' + new Identicon(hash, options).toString();
                  }


        return(

                <ScrollView
                showsVerticalScrollIndicator={false}
                >
                    <FlatList
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={null}
                        extraData={this.state.index}
                        data={this.state.payees}
                        keyExtractor={item => item.nickname}
                        renderItem={({item}) => (
                            <ListItem
                                title={item.nickname}
                                subtitle={item.address.substr(0, 15) + '...'}
                                subtitleStyle={{
                                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
                                }}
                                leftIcon={
                                  <Image
                                    style={{width: 50, height: 50}}
                                    source={{uri: get_avatar(item.address)}}
                                  />
                                }
                                titleStyle={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontFamily: 'Montserrat-SemiBold'
                                }}
                                subtitleStyle={{
                                    color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                                    fontFamily: 'Montserrat-Regular'
                                }}
                                onPress={() => {
                                    this.props.navigation.navigate(
                                        'Transfer', {
                                            payee: item,
                                        }
                                    );
                                }}
                            />
                        )}
                    />
                </ScrollView>
        );
    }
}

class ExistingPayeesNoTranslation extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
      const { t } = this.props;
        const noPayeesComponent =
            <View>
                <Text style={{
                    color: this.props.screenProps.theme.primaryColour,
                    marginTop: 10,
                    fontSize: 16,
                    fontFamily: 'Montserrat-Regular'
                }}>
                    {t('emptyAddressBook')}
                </Text>
            </View>

        return(
            <View style={{
                width: '90%',
                maxHeight: '70%',
                borderWidth: 0
            }}>
                <View style={{
                }}>
                    <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        marginTop: 40,
                        fontFamily: 'Montserrat-SemiBold'
                    }}>
                        Address Book
                    </Text>

                    {Globals.payees.length > 0 ? <AddressBook {...this.props}/> : noPayeesComponent}
                </View>
            </View>
        );
    }
}

const ExistingPayees = withTranslation()(ExistingPayeesNoTranslation)

export class NewPayeeScreenNoTranslation extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerRight: (
                <CrossButton navigation={navigation}/>
            ),
        }
    };

    constructor(props) {
        super(props);

        const address = this.props.navigation.getParam('address', '');
        const paymentID = this.props.navigation.getParam('paymentID', '');

        this.state = {
            nickname: '',
            address,
            paymentID,
            paymentIDEnabled: address.length !== Config.integratedAddressLength,
            addressError: '',
            paymentIDError: '',
            nicknameError: '',
        };
    }

    setAddressFromQrCode(address) {
        this.setState({
            address,
        }, () => this.checkErrors());
    }

    async validAddress(address) {
        let errorMessage = '';

        if (address === '' || address === undefined || address === null) {
            return [false, errorMessage];
        }

        /* Disable payment ID and wipe input if integrated address */
        if (address.length === Config.integratedAddressLength) {
            await this.setState({
                paymentID: '',
                paymentIDEnabled: false,
            });
        } else {
            this.setState({
                paymentIDEnabled: true,
            });
        }

        if (address.length === 163) {
          // Hugin address

          await this.setState({
              address: address.substring(0,99),
              paymentID: address.substring(99),
              paymentIDEnabled: true
          });
          address = address.substring(0,99);
        }
        const addressError = await validateAddresses([address], true, Config);

        if (addressError.errorCode !== WalletErrorCode.SUCCESS) {
            errorMessage = addressError.toString();

            return [false, errorMessage];
        }

        return [true, errorMessage];
    }

    validPaymentID(paymentID) {
        let errorMessage = '';

        if (paymentID === '') {
            return [true, errorMessage];
        }

        if (paymentID === undefined || paymentID === null) {
            return [false, errorMessage];
        }

        const paymentIDError = validatePaymentID(paymentID);

        if (paymentIDError.errorCode !== WalletErrorCode.SUCCESS) {
            errorMessage = paymentIDError.toString();

            return [false, errorMessage];
        }

        return [true, errorMessage];
    }

    validNickname(nickname) {
        let errorMessage = '';

        if (nickname === '' || nickname === undefined || nickname === null) {
            return [false, errorMessage];
        }

        if (Globals.payees.some((payee) => payee.nickname === nickname)) {
            errorMessage = `A payee with the name ${nickname} already exists.`;
            return [false, errorMessage];
        }

        return [true, errorMessage];
    }

    checkErrors() {
        (async() => {

            const [addressValid, addressError] = await this.validAddress(this.state.address);
            const [paymentIDValid, paymentIDError] = this.validPaymentID(this.state.paymentID);
            const [nicknameValid, nicknameError] = this.validNickname(this.state.nickname);

            this.setState({
                continueEnabled: addressValid && paymentIDValid && nicknameValid,
                addressError,
                paymentIDError,
                nicknameError,
            });

        })();
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    flex: 1,
                    marginTop: 60,
                }}>
                    <Text style={{ fontFamily: "Montserrat-SemiBold", color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 40, marginLeft: 30 }}>
                        {t('newContact')}
                    </Text>

                    <Input
                        containerStyle={{
                            width: '90%',
                            marginLeft: 20,
                            marginBottom: 30,
                            fontFamily: 'Montserrat-Regular',
                        }}
                        inputContainerStyle={{
                            borderWidth: 0,
                            borderRadius: 15,
                            backgroundColor: "rgba(0,0,0,0.2)",
                            borderColor: 'transparent'
                        }}
                        label={t('name')}
                        labelStyle={{
                            fontFamily: 'Montserrat-Regular',
                            marginBottom: 5,
                            marginRight: 2,
                            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 30,
                            marginLeft: 5,
                            fontFamily: 'Montserrat-SemiBold',
                        }}
                        value={this.state.nickname}
                        onChangeText={(text) => {
                            this.setState({
                                nickname: text,
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.nicknameError}
                    />

                    <Input
                        containerStyle={{
                            width: '90%',
                            marginLeft: 20,
                        }}
                        inputContainerStyle={{
                          borderWidth: 0,
                          borderRadius: 15,
                          backgroundColor: "rgba(0,0,0,0.2)",
                          borderColor: 'transparent'
                        }}
                        maxLength={Config.integratedAddressLength}
                        label={t('paymentAddress')}
                        labelStyle={{
                            fontFamily: 'Montserrat-Regular',
                            marginBottom: 5,
                            marginRight: 2,
                            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 15,
                            marginLeft: 5
                        }}
                        value={this.state.address}
                        onChangeText={(text) => {
                            this.setState({
                                address: text,
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.addressError}
                    />

                    <View style={{ marginLeft: '63%', marginTop: 8, borderRadius: 3, paddingTop: 0,
                                    borderColor: this.props.screenProps.theme.borderColour,
                                    borderWidth: 1,}}>
                        <Button
                            title={t('scanQR')}
                            onPress={() => {
                                const func = (data) => {
                                    if (data.startsWith(Config.uriPrefix)) {
                                        handleURI(data, this.props.navigation);
                                    } else {
                                        this.setState({
                                            address: data,
                                            // paymentID: data.substring(99),
                                        }, () => this.checkErrors());
                                    }
                                };

                                this.props.navigation.navigate('QrScanner', {
                                    setAddress: func
                                });
                            }}
                            titleStyle={{
                                color: this.props.screenProps.theme.primaryColour,
                                fontFamily: 'Montserrat-SemiBold'

                            }}
                            type="clear"
                        />
                    </View>

                    <Input
                        containerStyle={{
                            width: '90%',
                            marginLeft: 20,
                        }}
                        inputContainerStyle={{
                          borderWidth: 0,
                          borderRadius: 15,
                          backgroundColor: "rgba(0,0,0,0.2)",
                          borderColor: 'transparent'
                        }}
                        maxLength={64}
                        label={t('messageKey')}
                        labelStyle={{
                            marginBottom: 5,
                            marginRight: 2,
                            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                            fontFamily: 'Montserrat-Regular'
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 15,
                            marginLeft: this.state.paymentIDEnabled ? 5 : 0,
                            backgroundColor: "rgba(0,0,0,0.2)"
                        }}
                        value={this.state.paymentID}
                        onChangeText={(text) => {
                            this.setState({
                                paymentID: text
                            }, () => this.checkErrors());
                        }}
                        editable={this.state.paymentIDEnabled}
                        errorMessage={this.state.paymentIDError}
                    />

                    <BottomButton
                        title={t('continue')}
                        onPress={() => {
                            const payee = {
                                nickname: this.state.nickname,
                                address: this.state.address,
                                paymentID: this.state.paymentID,
                            };

                            /* Add payee to global payee store */
                            Globals.addPayee(payee);

                            const finishFunction = this.props.navigation.getParam('finishFunction', undefined);

                            if (finishFunction) {
                                finishFunction(payee);
                            } else {
                              this.props.navigation.navigate(
                                  'ChatScreen', {
                                      payee: payee,
                                  });
                                  return;
                                const amount = this.props.navigation.getParam('amount', undefined);

                                /* Already have an amount, don't need to go to transfer screen */
                                if (amount) {
                                    this.props.navigation.navigate(
                                        'Confirm', {
                                            payee,
                                            amount,
                                        }
                                    );

                                } else {
                                    this.props.navigation.navigate(
                                        'Transfer', {
                                            payee,
                                        }
                                    );
                                }
                            }
                        }}
                        disabled={!this.state.continueEnabled}
                        {...this.props}
                    />
                </View>
            </View>
        );
    }
}

export const NewPayeeScreen = withTranslation()(NewPayeeScreenNoTranslation)

class ModifyMemo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <Input
                containerStyle={{
                    width: '100%',
                }}
                inputContainerStyle={{
                    borderColor: this.props.screenProps.theme.notVeryVisibleColour,
                    borderWidth: 1,
                    borderRadius: 2,
                    width: '100%',
                    height: 30,
                }}
                inputStyle={{
                    color: this.props.screenProps.theme.primaryColour,
                    fontSize: 14,
                }}
                value={this.props.memo}
                onChangeText={(text) => {
                    if (this.props.onChange) {
                        this.props.onChange(text);
                    }
                }}
            />
        );
    }
}

export class ConfirmScreenNoTranslation extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerRight: (
                <CrossButton navigation={navigation}/>
            ),
        }
    };

    constructor(props) {
        super(props);

        this.state = {
        };
        }

        async componentDidMount() {
        const [unlockedBalance, lockedBalance] = await Globals.wallet.getBalance();

        const { payee, amount, sendAll } = this.props.navigation.state.params;

        const fullAmount = sendAll ? unlockedBalance : amount;

        const devFee = Math.floor((fullAmount * Config.devFeePercentage) / 100);

        const [feeAddress, nodeFee] = Globals.wallet.getNodeFee();

        this.setState({
            memo: '',
            modifyMemo: false,
            preparedTransaction: false,
            haveError: false,
            payee,
            amount,
            sendAll,
            unlockedBalance,
            devFee,
            nodeFee,
        });

        this.prepareTransaction();
    }

    async prepareTransaction() {
        const payments = [];

        /* User payment */
        if (this.state.sendAll) {
            payments.push([
                this.state.payee.address,
                1, /* Amount does not matter for sendAll destination */
            ]);
        } else {
            payments.push([
                this.state.payee.address,
                this.state.amount,
            ]);
        }

        if (this.state.devFee > 0) {
            /* Dev payment */
            payments.push([
                Config.devFeeAddress,
                this.state.devFee,
            ]);
        }

        // let [new_address, error] = await Globals.wallet.addSubWallet();

        const result = await Globals.wallet.sendTransactionAdvanced(
            payments, // destinations,
            3, // mixin
            {feePerByte: 10, isFeePerByte: true}, // fee
            this.state.payee.paymentID,
            undefined, // subWalletsToTakeFrom
            undefined, // changeAddress
            false, // relayToNetwork
            this.state.sendAll,
        );

        if (result.success) {
            let actualAmount = this.state.amount;
            for (const input of result.preparedTransaction.inputs) {
            }
            if (this.state.sendAll) {
                let transactionSum = 0;

                /* We could just get the sum by calling getBalance.. but it's
                 * possibly just changed. Safest to iterate over prepared
                 * transaction and calculate it. */
                for (const input of result.preparedTransaction.inputs) {
                    transactionSum += input.input.amount;
                }

                actualAmount = transactionSum
                             - result.fee
                             - this.state.devFee
                             - this.state.nodeFee;
            }

            this.setState({
                preparedTransaction: true,
                haveError: false,
                fee: result.fee,
                hash: result.transactionHash,
                recipientAmount: actualAmount,
                feeTotal: result.fee + this.state.devFee + this.state.nodeFee,
            });
        } else {
            this.setState({
                preparedTransaction: true,
                haveError: true,
                error: result.error,
            });
        }
    }

    preparingScreen(t) {
        return(
            <View style={{
                flex: 1,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                marginTop: 60,
                marginHorizontal: 30,
            }}>
                <Animatable.Text
                    style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                    }}
                    animation='pulse'
                    iterationCount='infinite'
                >
                    {t('estimating')}
                </Animatable.Text>
            </View>
        );
    }

    errorScreen() {
        let errorMessage = this.state.error.toString();

        if (this.state.error.errorCode === WalletErrorCode.NOT_ENOUGH_BALANCE) {
            if (this.state.sendAll) {
                errorMessage = 'Unfortunately, your balance is too low to cover the network fee required to send your funds.';
            } else {
                errorMessage = 'Not enough balance to cover amount including fees!\n' +
                    'Either reduce the amount you are sending, or use the "send all" option to send the max possible.\n\n';
            }
        }

        return(
            <View style={{
                flex: 1,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                marginTop: 60,
                marginHorizontal: 30,
            }}>
                <Animatable.Text
                    style={{
                        color: 'red',
                        fontSize: 25,
                        marginBottom: 25,
                        fontWeight: 'bold',
                    }}
                    animation='shake'
                    delay={1000}
                >
                    Estimating fee and preparing transaction failed!
                </Animatable.Text>

                <Text style={{ fontSize: 13 }}>
                    {errorMessage}
                </Text>
            </View>
        );
    }

    confirmScreen(t) {
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 60,
                    marginHorizontal: 30,
                }}>
                    <Text style={{ fontFamily: 'Montserrat-SemiBold', color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 25 }}>
                        {t('reviewTitle')}
                    </Text>
                </View>

                <ScrollView contentContainerStyle={{
                    paddingBottom: 70,
                }}>
                    <View style={{
                        marginHorizontal: 30,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}>
                        <Text style={{ fontFamily: 'Montserrat-Regular',fontSize: 13, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                            <Text style={{ color: this.props.screenProps.theme.primaryColour, fontWeight: 'bold' }}>
                                {prettyPrintAmount(this.state.recipientAmount, Config)}{' '}
                            </Text>
                            will reach{' '}
                            <Text style={{ color: this.props.screenProps.theme.primaryColour, fontWeight: 'bold' }}>
                                {this.state.payee.nickname}'s{' '}
                            </Text>
                            account, in {getArrivalTime([t('minute'), t('second')])}
                        </Text>

                        <View style={{
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 15,
                                width: '100%',
                                justifyContent: 'space-between'
                            }}>
                                <Text style={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontFamily: 'Montserrat-SemiBold',
                                }}>
                                    {t('notes')}
                                </Text>

                                <Button
                                    title={t('change')}
                                    onPress={() => {
                                        this.setState({
                                            modifyMemo: !this.state.modifyMemo,
                                        });
                                    }}
                                    titleStyle={{
                                        color: this.props.screenProps.theme.primaryColour,
                                        fontSize: 13
                                    }}
                                    type="clear"
                                />
                            </View>
                        </View>

                        <View style={{ borderWidth: 0.7, borderColor: 'lightgrey', width: '100%' }}/>
                    </View>

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: this.state.modifyMemo ? 20 : 30,
                        marginTop: 20,
                    }}>
                        {this.state.modifyMemo ?
                            <ModifyMemo
                                memo={this.state.memo}
                                onChange={(text) => {
                                    this.setState({
                                        memo: text,
                                    })
                                }}
                                {...this.props}
                            />
                            :
                            <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                                {this.state.memo === '' ? t('none') : this.state.memo}
                            </Text>
                        }
                    </View>

                    <View style={{
                        marginHorizontal: 30,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 15,
                            width: '100%',
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 15, color: this.props.screenProps.theme.primaryColour }}>
                                {this.state.payee.nickname}{t('details')}
                            </Text>

                            <Button
                                title={t('change')}
                                onPress={() => {
                                    this.props.navigation.navigate('ChoosePayee');
                                }}
                                titleStyle={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontSize: 13
                                }}
                                type="clear"
                            />
                        </View>

                        <View style={{ borderWidth: 0.7, borderColor: 'lightgrey', width: '100%' }}/>

                        <Text style={{ fontFamily: 'Montserrat-SemiBold', marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                            {t('address')}
                        </Text>

                        <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                            {this.state.payee.address}
                        </Text>

                        {this.state.payee.paymentID !== '' &&
                        <View>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', marginBottom: 5, marginTop: 20 }}>
                                {t('paymentID')}
                            </Text>

                            <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                                {this.state.payee.paymentID}
                            </Text>
                        </View>}

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 15,
                            width: '100%',
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 15, color: this.props.screenProps.theme.primaryColour }}>
                                {t('transferDetails')}
                            </Text>

                            <Button
                                title={t('change')}
                                onPress={() => {
                                    this.props.navigation.navigate(
                                        'Transfer', {
                                            payee: this.state.payee,
                                        }
                                    );
                                }}
                                titleStyle={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontSize: 13
                                }}
                                type="clear"
                            />
                        </View>

                        <View style={{ borderWidth: 0.7, borderColor: 'lightgrey', width: '100%' }}/>

                        <Text style={{ fontFamily: 'Montserrat-Regular', marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                            {t('sendAmountLabel')}
                        </Text>

                        <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                            {prettyPrintAmount(this.state.sendAll ? this.state.unlockedBalance : this.state.recipientAmount + this.state.feeTotal, Config)}
                        </Text>

                        <Text style={{ fontFamily: 'Montserrat-Regular', marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                            {this.state.payee.nickname} {t('gets')}
                        </Text>

                        <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                            {prettyPrintAmount(this.state.recipientAmount, Config)}
                        </Text>

                        <Text style={{ fontFamily: 'Montserrat-Regular',marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                            {t('fee')}
                        </Text>

                        <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                            {prettyPrintAmount(this.state.fee, Config)}
                        </Text>

                        {this.state.devFee > 0 &&
                        <View>
                            <Text style={{ fontFamily: 'Montserrat-Regular',marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                                Developer fee
                            </Text>

                            <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                                {prettyPrintAmount(this.state.devFee, Config)}
                            </Text>
                        </View>}

                        {this.state.nodeFee > 0 &&
                        <View>
                            <Text style={{ fontFamily: 'Montserrat-Regular',marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                                {t('nodeFee')}
                            </Text>

                            <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                                {prettyPrintAmount(this.state.nodeFee, Config)}
                            </Text>
                        </View>}

                        <View>
                            <Text style={{ fontFamily: 'Montserrat-Regular',marginBottom: 5, marginTop: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                                Total fee
                            </Text>

                            <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                                {prettyPrintAmount(this.state.feeTotal, Config)}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <BottomButton
                    title={t('sendTransaction')}
                    onPress={() => {
                        const params = {
                            amount: this.state.recipientAmount,
                            address: this.state.payee.address,
                            paymentID: this.state.payee.paymentID,
                            nickname: this.state.payee.nickname,
                            memo: this.state.memo,
                            hash: this.state.hash,
                        };

                        if (Globals.preferences.authConfirmation) {
                            /* Verify they have the correct pin, then send the actual TX */
                            Authenticate(
                                this.props.navigation,
                                'to confirm the transaction',
                                () => {
                                    this.props.navigation.dispatch(navigateWithDisabledBack('ChoosePayee'));
                                    this.props.navigation.navigate('SendTransaction', {...params});
                                }
                            );
                        } else {
                            /* Reset this stack to be on the transfer screen */
                            this.props.navigation.dispatch(navigateWithDisabledBack('ChoosePayee'));

                            /* Then send the actual transaction */
                            this.props.navigation.navigate('SendTransaction', {...params});
                        }
                    }}
                    {...this.props}
                />
            </View>
        );
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                { this.state.preparedTransaction
                    ? this.state.haveError
                        ? this.errorScreen(t)
                        : this.confirmScreen(t)
                    : this.preparingScreen(t) }
            </View>
        );
    }
}

export const ConfirmScreen = withTranslation()(ConfirmScreenNoTranslation)

export class ChoosePayeeScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);
    }

    static navigationOptions = ({ navigation, screenProps }) => {
        return {
            headerLeft: (
                <HeaderBackButton
                    tintColor={screenProps.theme.primaryColour}
                    onPress={() => { navigation.navigate('Main') }}
                />
            ),
            headerRight: (
                <CrossButton navigation={navigation}/>
            ),
        }
    };

    render() {
        const { t } = this.props;
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginLeft: 30,
                    marginTop: 60,
                    marginRight: 10,
                }}>
                    <Text style={{ fontFamily: "Montserrat-SemiBold", color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 30 }}>
                        {t('sendToWho')}
                    </Text>
                </View>

                <View style={{
                    marginLeft: 24,
                    width: 120,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    borderRadius: 3, paddingTop: 0,
                                    borderColor: this.props.screenProps.theme.borderColour,
                                    borderWidth: 1
                }}>
                    <Button
                        title={t('scanQR')}
                        onPress={() => {
                            const func = (data) => {
                                handleURI(data, this.props.navigation);
                            };

                            this.props.navigation.navigate('QrScanner', {
                                setAddress: func
                            });
                        }}
                        titleStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontFamily: 'Montserrat-SemiBold'
                        }}
                        type="clear"
                    />
                </View>

                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginLeft: 30,
                    marginRight: 10,
                }}>


                    <TouchableWithoutFeedback
                        onPress={() => {
                            this.props.navigation.navigate('NewPayee');
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 10,

                        }}>
                            <View style={{
                                height: 37,
                                width: 37,
                                borderWidth: 1,
                                borderColor: this.props.screenProps.theme.borderColour,
                                borderRadius: 45,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <SimpleLineIcons
                                    name={'user-follow'}
                                    size={24}
                                    color={this.props.screenProps.theme.slightlyMoreVisibleColour}
                                    padding={5}
                                />
                            </View>

                            <Text style={{ fontFamily: 'Montserrat-Regular', marginLeft: 15, color: this.props.screenProps.theme.primaryColour, fontSize: 16 }}>
                                {t('addNewRecipient')}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>



                    <ExistingPayees {...this.props}/>
                </View>
             </View>
        );
    }
}

export const ChoosePayeeScreen = withTranslation()(ChoosePayeeScreenNoTranslation)

export class SendTransactionScreenNoTranslation extends React.Component {
    static navigationOptions = {
        header: null,
    }

    constructor(props) {
        super(props);

        this.state = {
            txInfo: 'Sending transaction, please wait...',
            errMsg: '',
            hash: this.props.navigation.state.params.hash,
            amount: this.props.navigation.state.params.amount,
            address: this.props.navigation.state.params.address,
            nickname: this.props.navigation.state.params.nickname,
            memo: this.props.navigation.state.params.memo,
            homeEnabled: false,
            sent: false,
        }

        /* Send the tx in the background (it's async) */
        this.sendTransaction();
    }

    async sendTransaction() {
        /* Wait for UI to load before blocking thread */
        await delay(500);

        const result = await Globals.wallet.sendPreparedTransaction(
            this.state.hash,
        );

        if (!result.success) {
            /* TODO: Optionally allow retries in case of network error? */
            Globals.wallet.deletePreparedTransaction(this.state.hash);

            this.setState({
                errMsg: result.error.toString(),
                homeEnabled: true,
            });
        } else {
            this.setState({
                homeEnabled: true,
                sent: true,
            });

            Globals.addTransactionDetails({
                hash: this.state.hash,
                memo: this.state.memo,
                address: this.state.address,
                payee: this.state.nickname,
            });
        }
    }

    render() {
        const { t } = this.props;
        const sending =
            <View>
                <Animatable.Text
                    style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                    }}
                    animation='pulse'
                    iterationCount='infinite'
                >
                    {t('sendingMsg')}
                </Animatable.Text>
            </View>;

        const fail =
            <View>
                <Animatable.Text
                    style={{
                        color: 'red',
                        fontSize: 25,
                        marginBottom: 25,
                        fontWeight: 'bold',
                    }}
                    animation='shake'
                    delay={1000}
                >
                    {t('failedMsg')}
                </Animatable.Text>

                <Text style={{ fontSize: 13 }}>
                    {this.state.errMsg}
                </Text>
            </View>;

        const success =
            <View>
                <Animatable.Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                        marginBottom: 25,
                        fontFamily: "Montserrat-SemiBold",
                    }}
                    animation='tada'
                    delay={1000}
                >
                    {t('completeMsg')}
                </Animatable.Text>

                <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                    <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour }}>
                        {prettyPrintAmount(this.state.amount, Config)}{' '}
                    </Text>
                    was sent to{' '}
                    <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour }}>
                        {this.state.nickname}'s{' '}
                    </Text>
                    account.
                </Text>

                <Text style={{ fontSize: 15, color: this.props.screenProps.theme.primaryColour, fontFamily: 'Montserrat-Regular', marginTop: 15 }}>
                    {t('transactionHash')}
                </Text>

                <TextTicker
                    marqueeDelay={1000}
                    duration={220 * 64}
                    style={{
                        color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                    }}
                >
                    {this.state.hash}
                </TextTicker>

                <Button
                    containerStyle={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginLeft: -8
                    }}
                    title={t('copy')}
                    onPress={() => {
                        Clipboard.setString(this.state.hash);
                        toastPopUp(t('copied'));
                    }}
                    titleStyle={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 13
                    }}
                    type="clear"
                />

            </View>;

        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    flex: 1,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 60,
                    marginHorizontal: 30,
                }}>
                    {this.state.sent ? success : this.state.errMsg === '' ? sending : fail}
                </View>

                <BottomButton
                    title="Home"
                    onPress={() => {
                        this.props.navigation.dispatch(navigateWithDisabledBack('ChoosePayee'));
                        this.props.navigation.navigate('Main');
                    }}
                    disabled={!this.state.homeEnabled}
                    {...this.props}
                />
            </View>
        );
    }
}

export const SendTransactionScreen = withTranslation()(SendTransactionScreenNoTranslation)
