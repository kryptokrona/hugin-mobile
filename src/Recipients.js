// Copyright (C) 2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import { checkText } from 'smile2emoji';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import {
    ActivityIndicator, Picker, Keyboard, KeyboardAvoidingView, View, Text, TextInput, ScrollView, FlatList, Platform, TouchableOpacity, Image
} from 'react-native';

import {
    mediaDevices,
    RTCPeerConnection,
    RTCView,
    RTCIceCandidate,
    RTCSessionDescription,
  } from 'react-native-webrtc';

import { parse_sdp, expand_sdp_offer, expand_sdp_answer } from './SDPParser';

import {
    validateAddresses, WalletErrorCode, validatePaymentID,
} from 'kryptokrona-wallet-backend-js';

import { Button as RNEButton, Alert } from 'react-native';

import { Button, Input, Icon } from 'react-native-elements';

import Config from './Config';
import ListItem from './ListItem';
import List from './ListContainer';

import { Styles, unread_counter_style, unread_counter_text_style } from './Styles';

import Moment from 'react-moment';

import 'moment/locale/de';
import 'moment/locale/sv';
import 'moment/locale/tr';
import 'moment/locale/zh-cn';
import 'moment/locale/nb';

import { Globals } from './Globals';
import { Hr, BottomButton, CopyButton } from './SharedComponents';

import {intToRGB, hashCode, get_avatar, sendMessage} from './HuginUtilities';

import {toastPopUp} from './Utilities';

import { saveMessage, getMessages, getLatestMessages, removeMessage, markConversationAsRead, loadPayeeDataFromDatabase } from './Database';

import './i18n.js';
import { withTranslation } from 'react-i18next';

import {AutoGrowingTextInput} from 'react-native-autogrow-textinput';

import CustomIcon from './CustomIcon.js'

import InvertibleScrollView from 'react-native-invertible-scroll-view';

import InCallManager from 'react-native-incall-manager';

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

export class RecipientsScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            payees: Globals.payees.filter(item => item.paymentID.length > 0),
            index: 0,
        }

        Globals.updatePayeeFunctions.push(() => {
            this.setState(prevState => ({
                payees: Globals.payees.filter(item => item.paymentID.length > 0),
                index: prevState.index + 1,
            }))
        });
    }

    render() {
        const { t } = this.props;
        let payees = this.state.payees;
        let uniquePayees = [];
        payees.forEach((element) => {
            if (!uniquePayees.includes(element)) {
                uniquePayees.push(element);
            }
        });
        payees = uniquePayees;
        const noPayeesComponent =
            <View style={{
                width: '100%',
            }}>

                <Text style={{
                    color: this.props.screenProps.theme.primaryColour,
                    marginTop: 10,
                    fontSize: 16
                }}>
                    {t('emptyAddressBook')}
                </Text>
            </View>;

        const newMessageIndicator =
          <Icon
            reverse
            name='ios-american-football'
            type='ionicon'
            color='#006BA7'
            size={0}
          />;

        const addressBookComponent =
            <ScrollView
            showsVerticalScrollIndicator={false}
             style={{
                width: '100%',
                height: '70%',
                marginBottom: 20,
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                borderWidth: 0,
                borderColor: 'transparent'
            }}>
                    <FlatList
                        extraData={this.state.index}
                        ItemSeparatorComponent={null}
                        data={payees}
                        keyExtractor={item => item.nickname}
                        renderItem={({item}) => (
                            <ListItem
                                title={item.nickname}
                                subtitle={item.lastMessage ? <View><Text numberOfLines={1} style={{fontFamily: 'Montserrat-Regular'}}>{item.lastMessage}{"\n"}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.lastMessageTimestamp/1000}</Moment></View> : t('noMessages')}
                                subtitleStyle={{
                                    fontFamily: "Montserrat-Regular"
                                }}
                                chevron={item.read == '1' ? false : <View style={[unread_counter_style, {borderColor: "#171717", marginTop: 1, marginRight: 5}]}><Text style={unread_counter_text_style}>{item.unreads}</Text></View> }
                                leftIcon={
                                    <Image
                                      style={{width: 50, height: 50}}
                                      source={{uri: get_avatar(item.address)}}
                                    />
                                    // <View style={{
                                    //     width: 50,
                                    //     height: 50,
                                    //     alignItems: 'center',
                                    //     justifyContent: 'center',
                                    //     backgroundColor: this.props.screenProps.theme.iconColour,
                                    //     borderRadius: 45
                                    // }}>
                                    //     <Text style={[Styles.centeredText, {
                                    //         fontSize: 30,
                                    //         color: this.props.screenProps.theme.primaryColour,
                                    //     }]}>
                                    //         {item.nickname[0].toUpperCase()}
                                    //     </Text>
                                    //
                                    // </View>
                                }
                                rightIcon={
                                    Globals.calls.find(call => call.contact == item.paymentID) ? 
                                    <View style={{backgroundColor: '#5ff281', borderRadius: 5, padding: 5}}>
                        <Text onPress={() => {
                            this.props.navigation.navigate(
                                'CallScreen', {
                                    payee: item,
                                    // sdp: 'wtfdoe'
                                }
                            );
                        }} style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: 12, color: this.props.screenProps.theme.backgroundColour, fontFamily: 'Montserrat-SemiBold' }}>
                            {t('inCall')}
                        </Text>

                        </View> :
                                    <></>
                                }
                                titleStyle={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontFamily: 'Montserrat-SemiBold'
                                }}showsVerticalScrollIndicator={false}
                                subtitleStyle={{
                                    color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                                    fontFamily: 'Montserrat-Regular'
                                }}
                                onPress={async () => {
                                    this.props.navigation.navigate(
                                        'ChatScreen', {
                                            payee: item,
                                        }
                                    );
                                    await markConversationAsRead(item.address);
                                    Globals.payees = await loadPayeeDataFromDatabase();
                                    this.setState({
                                        payees: Globals.payees.filter(item => item.paymentID.length > 0)
                                    });
                                }}
                            />
                        )}
                    />
            </ScrollView>;

        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
            }}>
                <View style={{
                    flex: 1,
                    marginLeft: 30,
                    marginTop: 15,
                    width: '85%'
                }}>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            height: 40,
                        }}>
                            <Text style={{
                                marginLeft: 15,
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 24,
                                fontFamily: "Montserrat-SemiBold"
                            }}>
                                {t('messagesTitle')}
                            </Text>

                        </View>
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 30,
                            marginRight: 10,
                        }}>
                            <TouchableOpacity
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.02)',
                                            borderWidth: 1,
                                            borderColor: this.props.screenProps.theme.borderColour,
                                            borderRadius: 15,
                                            padding: 10,
                                            flexDirection: 'row',
                                            alignContent: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 10,
                                        }}
                                        onPress={() => {
                                            Globals.fromChat = true;
                                            this.props.navigation.navigate('NewPayee', {
                                                finishFunction: (item) => {
                                                    this.props.navigation.navigate(
                                                        'ChatScreen', {
                                                            payee: item,
                                                        });
                                                }
                                            })
                                        }}
                                    >
                                        <CustomIcon name='user-add' size={18} style={{marginRight: 4, color: 'rgba(255,255,255,0.8)'}} />
                                        <Text style={{
                                            color: this.props.screenProps.theme.primaryColour,
                                            textAlign: 'left',
                                            fontSize: 14,
                                            fontFamily: 'Montserrat-Bold',
                                            textAlign: 'center'
                                        }}>
                                            {t('addNewRecipient')}
                                        </Text>
                            </TouchableOpacity>
                        </View>


                    <View style={{
                        backgroundColor: this.props.screenProps.theme.backgroundColour,
                        flex: 1,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}>

                        {this.state.payees?.length > 0 ? addressBookComponent : noPayeesComponent}

                    </View>
                </View>
            </View>
        );
    }
}

export const RecipientsScreen = withTranslation()(RecipientsScreenNoTranslation)

function isPaymentIDValid(paymentID) {
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

class ModifyPaymentID extends React.Component {
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
                    borderWidth: this.props.disabled ? 0 : 1,
                    borderRadius: 2,
                    width: '100%',
                    height: 30,
                }}
                inputStyle={{
                    color: this.props.screenProps.theme.primaryColour,
                    fontSize: 14,
                    backgroundColor: this.props.disabled ?
                                     this.props.screenProps.theme.disabledColour :
                                     this.props.screenProps.theme.backgroundColor,
                }}
                maxLength={64}
                value={this.props.paymentID}
                onChangeText={(text) => {
                    if (this.props.onChange) {
                        this.props.onChange(text);
                    }
                }}
                errorMessage={this.props.error}
                editable={!this.props.disabled}
                placeholder={this.props.disabled ? 'Disabled when using an integrated address' : ''}
            />
        );
    }
}

function isAddressValid(address) {
    let errorMessage = '';

    if (address === '' || address === undefined || address === null) {
        errorMessage = 'Address cannot be blank.';
        return [false, errorMessage];
    }

    const addressError = validateAddresses([address], true, Config);

    if (addressError.errorCode !== WalletErrorCode.SUCCESS) {
        errorMessage = addressError.toString();
        return [false, errorMessage];
    }

    return [true, errorMessage];
}

class ModifyAddress extends React.Component {
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
                maxLength={Config.integratedAddressLength}
                value={this.props.address}
                onChangeText={(text) => {
                    if (this.props.onChange) {
                        this.props.onChange(text);
                    }
                }}
                errorMessage={this.props.error}
            />
        );
    }
}

function isNicknameValid(nickname, initialNickname) {
    let errorMessage = '';

    if (nickname === '' || nickname === undefined || nickname === null) {
        errorMessage = 'Name cannot be blank.';
        return [false, errorMessage];
    }

    if (Globals.payees.some((payee) => payee.nickname === nickname) && nickname != initialNickname) {
        errorMessage = `A payee with the name ${nickname} already exists.`;

        return [false, errorMessage];
    }

    return [true, errorMessage];
}

class ModifyNickname extends React.Component {
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
                value={this.props.nickname}
                onChangeText={(text) => {
                    if (this.props.onChange) {
                        this.props.onChange(text);
                    }
                }}
                errorMessage={this.props.error}
            />
        );
    }
}

export class ModifyPayeeScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { address, nickname, paymentID } = this.props.navigation.state.params.payee;

        console.log(address, paymentID);

        this.state = {
            address,
            nickname,
            paymentID,

            initialAddress: address,
            initialNickname: nickname,
            initialPaymentID: paymentID,

            modifyAddress: false,
            modifyNickname: false,
            modifyPaymentID: false,

            newAddress: address,
            newNickname: nickname,
            newPaymentID: paymentID,

            addressError: '',
            nicknameError: '',
            paymentIDError: '',

            paymentIDEnabled: address.length !== Config.integratedAddressLength,

            addressValid: true,
            nicknameValid: true,
            paymentIDValid: true,
        }
    }

    componentDidMount() {
        this.focusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
                const { address, nickname, paymentID } = Globals.payees.filter(payee => payee.address == this.state.address)[0];
                this.setState({
                    nickname: nickname,
                    address: address,
                    paymentID: paymentID
                })
            }
          );
    }

    render() {
        const { t } = this.props;
        return(
            <View style={{
                flex: 1,
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                justifycontent: 'flex-start',
                alignItems: 'flex-start',
            }}>
                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 60,
                    marginLeft: 30,
                    backgroundColor: this.props.screenProps.theme.backgroundColour,
                }}>
                    <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                        marginBottom: 25,
                        fontWeight: 'bold',
                        fontFamily: 'Montserrat-SemiBold'
                    }}>
                        {this.state.nickname + t('details')}
                    </Text>
                </View>

                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginHorizontal: 30,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 15,
                        width: '100%',
                        justifyContent: 'space-between'
                    }}>
                        <Image
                          style={{width: 50, height: 50}}
                          source={{uri: get_avatar(this.state.address)}}
                        />

                        <CopyButton
                            data={this.state.address + this.state.paymentID}
                            name={this.state.address + this.state.paymentID + t('copied')}
                            {...this.props}
                        />

                    </View>
                </View>

                <View style={{
                    width: '100%',
                    alignItems: 'center',
                }}>

                </View>

                <View
                    style={{
                        marginRight: 30,
                        marginBottom: 130,
                        width: '100%',
                        height: '60%',
                    }}
                    contentContainerStyle={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}
                >
                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: 30,
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
                                fontFamily: 'Montserrat-SemiBold'
                            }}>
                                {t('name')}
                            </Text>

                            <Button
                                title={t('change')}
                                onPress={() => {
                                    this.setState({
                                        modifyNickname: !this.state.modifyNickname,
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

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: this.state.modifyNickname ? 20 : 30,
                    }}>
                        {this.state.modifyNickname ?
                            <ModifyNickname
                                nickname={this.state.nickname}
                                error={this.state.nicknameError}
                                onChange={(text) => {
                                    const [valid, error] = isNicknameValid(text, this.state.initialNickname);

                                    const shared = {
                                        nickname: text,
                                        nicknameError: error,
                                        nicknameValid: valid,
                                    };

                                    if (valid) {
                                        this.setState({
                                            newNickname: text,
                                            ...shared,
                                        });
                                    } else {
                                        this.setState(shared);
                                    }
                                }}
                                {...this.props}
                            />
                            :
                            <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.slightlyMoreVisibleColour, fontSize: 16 }}>
                                {this.state.nickname}
                            </Text>
                        }
                    </View>

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: 30,
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
                                fontFamily: 'Montserrat-SemiBold'
                            }}>
                                {t('address')}
                            </Text>

                            <Button
                                title={t('change')}
                                onPress={() => {
                                    this.setState({
                                        modifyAddress: !this.state.modifyAddress,
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

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: this.state.modifyAddress ? 20 : 30,
                    }}>
                        {this.state.modifyAddress ?
                            <ModifyAddress
                                address={this.state.address}
                                error={this.state.addressError}
                                onChange={(text) => {
                                    const [valid, error] = isAddressValid(text);

                                    const shared = {
                                        address: text,
                                        addressError: error,
                                        addressValid: valid,

                                        /* Disable and reset payment ID if integrated address */
                                        paymentID: text.length === Config.integratedAddressLength ? '' : this.state.paymentID,
                                        paymentIDError: text.length === Config.integratedAddressLength ? '' : this.state.paymentIDError,
                                        paymentIDValid: text.length === Config.integratedAddressLength ? true : this.state.paymentIDValid,
                                        paymentIDEnabled: text.length !== Config.integratedAddressLength,
                                    };

                                    if (valid) {
                                        this.setState({
                                            newAddress: text,
                                            ...shared,
                                        });
                                    } else {
                                        this.setState(shared);
                                    }
                                }}
                                {...this.props}
                            />
                            :
                            <Text style={{fontFamily: 'Montserrat-Regular',  color: this.props.screenProps.theme.slightlyMoreVisibleColour, fontSize: 16 }}>
                                {this.state.address}
                            </Text>
                        }
                    </View>

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: 30,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            width: '100%',
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{
                                color: this.props.screenProps.theme.primaryColour,
                                fontFamily: 'Montserrat-SemiBold'
                            }}>
                                {t('messageKey')}
                            </Text>

                            <Button
                                title={t('change')}
                                onPress={() => {
                                    this.setState({
                                        modifyPaymentID: !this.state.modifyPaymentID,
                                    });
                                }}
                                titleStyle={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontSize: 13,
                                }}
                                type="clear"
                            />
                        </View>
                    </View>

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: this.state.modifyPaymentID ? 20 : 30,
                    }}>
                        {this.state.modifyPaymentID ?
                            <ModifyPaymentID
                                paymentID={this.state.paymentID}
                                error={this.state.paymentIDError}
                                onChange={(text) => {
                                    const [valid, error] = isPaymentIDValid(text);

                                    const shared = {
                                        paymentID: text,
                                        paymentIDError: error,
                                        paymentIDValid: valid,
                                    };

                                    if (valid) {
                                        this.setState({
                                            newPaymentID: text,
                                            ...shared,
                                        });
                                    } else {
                                        this.setState(shared);
                                    }
                                }}
                                disabled={!this.state.paymentIDEnabled}
                                {...this.props}
                            />
                            :
                            <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.slightlyMoreVisibleColour, fontSize: 16 }}>
                                {this.state.paymentID || 'None'}
                            </Text>
                        }
                    </View>
                </View>

                <View style={{
                    marginHorizontal: 30,
                    flex: 1,
                }}>
                    <View style={{
                        alignItems: 'stretch',
                        width: '100%',
                        bottom: 125,
                        position: 'absolute',
                        borderRadius: 10,
                    }}>
                        <RNEButton
                            title={t('update')}
                            onPress={() => {
                                Globals.removePayee(this.state.initialNickname, false);

                                Globals.addPayee({
                                    address: this.state.newAddress,
                                    nickname: this.state.newNickname,
                                    paymentID: this.state.newPaymentID,
                                    lastMessage: this.state.lastMessage,
                                });
                                this.setState({
                                    payees: Globals.payees
                                });
                                this.props.navigation.goBack();
                            }}
                            color={this.props.screenProps.theme.primaryColour}
                            disabled={!this.state.addressValid || !this.state.nicknameValid || !this.state.paymentIDValid}
                        />
                    </View>
                </View>

                <View style={{
                    marginHorizontal: 30,
                    flex: 1,
                }}>
                    <View style={{
                        alignItems: 'stretch',
                        width: '100%',
                        bottom: 70,
                        position: 'absolute',
                        borderRadius: 10,
                    }}>
                        <RNEButton
                            title={t('remove')}
                            onPress={() => {
                                Alert.alert(
                                    t('remove'),
                                    t('removeWarning'),
                                    [
                                        { text: t('remove'), onPress: () => {
                                            Globals.removePayee(this.state.initialNickname, true);
                                            this.setState({
                                                payees: Globals.payees
                                            });
                                            this.props.navigation.pop(2);
                                        }},
                                        { text: t('cancel'), style: 'cancel'},
                                    ],
                                );
                            }}
                            color='#DD3344'
                        />
                    </View>
                </View>
            </View>
        );
    }
}

export const ModifyPayeeScreen = withTranslation()(ModifyPayeeScreenNoTranslation)


export class ChatScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { address, nickname, paymentID } = this.props.navigation.state.params.payee;

        this.state = {
            address,
            nickname,
            paymentID,

            initialAddress: address,
            initialNickname: nickname,
            initialPaymentID: paymentID,

            modifyAddress: false,
            modifyNickname: false,
            modifyPaymentID: false,

            newAddress: address,
            newNickname: nickname,
            newPaymentID: paymentID,

            addressError: '',
            nicknameError: '',
            paymentIDError: '',

            paymentIDEnabled: address.length !== Config.integratedAddressLength,
            input: React.createRef(),
            addressValid: true,
            nicknameValid: true,
            paymentIDValid: true,

            messages: [],
            message: "",
            messageHasLength: false,

        }


        Globals.updateChatFunctions.push(async () => {
            this.setState({
                messages: await getMessages(this.state.address)
            })
        });

    }

    async componentDidMount() {

        const messages = await getMessages(this.state.address);
        markConversationAsRead(this.state.address);

        console.log('messages', messages);

        this.setState({
          messages: messages
        });

        Globals.activeChat = this.state.address;

        this.focusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
                markConversationAsRead(this.state.address);
                Globals.activeChat = this.state.address;
                const { address, nickname, paymentID } = Globals.payees.filter(payee => payee.address == this.state.address)[0];
                this.setState({
                    nickname: nickname,
                    address: address,
                    paymentID: paymentID
                })
            }
          );

          this.blurSubscription = this.props.navigation.addListener(
            'willBlur',
            () => {
                Globals.activeChat = '';
            }
        );

    }

    async componentWillUnmount() {

        Globals.activeChat = '';
        this.focusSubscription();

    }

    render() {

       const { t } = this.props;

       const submitMessage = async (text) => {

        Keyboard.dismiss();
        this.state.input.current._textInput.clear();

        this.setState({messageHasLength: this.state.message.length > 0});

        let temp_timestamp = Date.now();

        await saveMessage(this.state.address, 'processing', text, temp_timestamp, 1);

        let updated_messages = await getMessages(this.state.address);
        if (!updated_messages) {
          updated_messages = [];
        }

        this.setState({
          messages: updated_messages,
          messageHasLength: false
        });
        this.scrollView.scrollTo({y: 0, animated: true});
        await sendMessage(checkText(text), this.state.address, this.state.paymentID, temp_timestamp);
        this.scrollView.scrollTo({y: 0, animated: true});
      } 

       const items = [];

       for (message in this.state.messages) {
           let timestamp = this.state.messages[message].timestamp / 1000;
           let this_timestamp = this.state.messages[message].timestamp;
           let this_message = this.state.messages[message].message;
           if (this.state.messages[message].type == 'received'){
              items.push(<View  key={message} style={{alignSelf: 'flex-start', marginLeft: 20, marginRight: 20, marginBottom: 20, backgroundColor: '#2C2C2C', padding: 15, borderRadius: 15}}><Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{this.state.messages[message].message}</Text><Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment></View>)
           } else {
             items.push(
             <View  key={message} style={[{ backgroundColor: '#006BA7' } ,{alignSelf: 'flex-end', marginLeft: 20, marginRight: 20, marginBottom: 20, padding: 15, borderRadius: 15}]}>
                
                    {this.state.messages[message].type == 'processing' && <View style={{position: 'absolute', top: 5, right: 5}}><ActivityIndicator /></View>}
                    {this.state.messages[message].type == 'failed' && <TouchableOpacity onPress={() => {removeMessage(this_timestamp); submitMessage(this_message)}}><Text style={{fontSize: 10}}>Message failed to send. Tap here to try again.</Text></TouchableOpacity>}
                <Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >
                    {this.state.messages[message].message}
                </Text>
                <Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>
                    {timestamp}
                </Moment>
            </View>)
           }

       }


        return(
            <View style={{
                flex: 1,
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                alignItems: 'center'
            }}>

                <View style={{
                    alignItems: 'center',
                    marginHorizontal: 30,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 5,
                        marginLeft: 'auto'
                    }}>
                        <View style={{flex: 1,flexDirection: 'row' }}>
                        <Image
                          style={{width: 50, height: 50}}
                          source={{uri: get_avatar(this.state.address)}}
                        />
                        <Text onPress={() => {
                            this.props.navigation.navigate(
                                'ModifyPayee', {
                                    payee: this.props.navigation.state.params.payee,
                                }
                            );
                        }} style={{ marginTop: 10, fontSize: 18, color: this.props.screenProps.theme.primaryColour, fontFamily: 'Montserrat-SemiBold' }}>
                            {this.state.nickname}
                        </Text>
                        </View>
                        <View style={{backgroundColor: '#5ff281', borderRadius: 5, padding: 5}}>
                        <Text onPress={() => {
                            this.props.navigation.navigate(
                                'CallScreen', {
                                    payee: this.props.navigation.state.params.payee,
                                    // sdp: 'wtfdoe'
                                }
                            );
                        }} style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: 12, color: this.props.screenProps.theme.backgroundColour, fontFamily: 'Montserrat-SemiBold' }}>
                            {Globals.calls.find(call => call.contact == this.props.navigation.state.params.payee.paymentID) ? t('inCall') : t('call')}
                        </Text>

                        </View>

                    </View>
                </View>

                <InvertibleScrollView
                    inverted
                    showsVerticalScrollIndicator={false}
                    style={{
                        marginBottom: 0,
                        width: '100%',
                        height: '80%',
                    }}
                    ref={ref => {this.scrollView = ref}}
                >

                <View style ={{flex:1}}>
  
                {items}

                </View>

                {this.state.messages?.length > 0 && this.state.messages[0]?.count != this.state.messages?.length && this.state.messages[0]?.count > 25 && this.state.messages?.length > 24 &&
                <View style={{
                    flex: 1,
                    alignContent: 'center',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10}}
                >
                <TouchableOpacity style={{
                    backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
                    borderWidth: 1,
                    borderColor: this.props.screenProps.theme.borderColour,
                    borderRadius: 15,
                    padding: 10,
                    flexDirection: 'row',
                    flex: 1,
                    width: "33%",
                    alignContent: 'center',
                    alignItems: 'center',
                    justifyContent: 'center'}}
                onPress={async () => {

                    let updated_messages = await getMessages(this.state.address, this.state.messages?.length + 25);
                    this.setState({
                    messages: updated_messages,
                    messageHasLength: false
                    });
                }}>

                      <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'center',
                        fontSize: 12,
                        fontFamily: 'Montserrat-Bold'
                      }}>

                    {t('loadMore')}

                      </Text>

                      </TouchableOpacity>
                      </View>
                
           
                }
                

                </InvertibleScrollView>

                <KeyboardAvoidingView
                 behavior={Platform.OS == "ios" ? "padding" : "height"}
                 style={{
                    marginHorizontal: 10,
                    marginBottom: 5,
                    flexDirection: 'row'
                }}>
                <View
                style={{
                    width: this.state.messageHasLength ? '80%' : '100%',
                      backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
                      borderWidth: 0,
                      borderColor: 'transparent',
                      borderRadius: 15
                  }}
                >
                <AutoGrowingTextInput
                    multiline={true}
                    textAlignVertical={'top'}
                    ref={this.state.input}
                    style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontFamily: 'Montserrat-Regular',
                        fontSize: 15,
                        width: '100%',
                        height: '100%',
                        padding: 15,

                    }}
                    maxLength={512}
                    placeholder={t('typeMessageHere')}
                    placeholderTextColor={'#ffffff'}
                    onSubmitEditing={async (e) => {
                      e.preventDefault();
                        // return;
                        // submitMessage(this.state.message);
                        // this.setState({message: '', messageHasLength: false});
                    }}
                    onChangeText={(text) => {
                        if (this.props.onChange) {
                            this.props.onChange(text);
                        }
                        this.state.message = text;
                        this.setState({messageHasLength: this.state.message.length > 0});
                    }}
                    errorMessage={this.props.error}
                />
                </View>
                {this.state.messageHasLength &&

                    <Button
                        title={t('send')}
                        onPress={() => {
                          submitMessage(this.state.message);
                          this.setState({message: '', messageHasLength: false});
                        }}
                        titleStyle={{

                        }}
                        type="clear"
                    />

                }



            </KeyboardAvoidingView>
            </View>
        );
    }
}

export const ChatScreen = withTranslation()(ChatScreenNoTranslation)

function startPeer() {
    const peer = new RTCPeerConnection( {
        iceServers: [
        {
        urls: [
            'stun:stun1.l.google.com:19302',
            'stun:global.stun.twilio.com:3478'
        ]
        }
    ],
    iceTransportPolicy: "all",
    sdpSemantics: 'unified-plan',
    trickle: false
    });

    return peer;
}

async function initWebRTC(contactKey) {


    let isFront = false;
    let videoSourceId;

    return new Promise((resolve, reject) => { 

    let new_peer;
    let data_peer;

    if (!Globals.stream) {

    mediaDevices.enumerateDevices().then(sourceInfos => {

    for (let i = 0; i < sourceInfos.length; i++) {
    const sourceInfo = sourceInfos[i];
    if (
        sourceInfo.kind == 'videoinput' &&
        sourceInfo.facing == (isFront ? 'user' : 'environment')
    ) {
        videoSourceId = sourceInfo.deviceId;
    }
    }
    });

    mediaDevices
        .getUserMedia({
        audio: {
            googNoiseSuppression: true
        },
        video: true,
        })
        .then(stream => {
        
        Globals.stream = stream;
        Globals.localWebcamOn = true;
        Globals.localMicOn = true;
        new_peer = startPeer();
        data_peer = startPeer()
        new_peer.addStream(Globals.stream);
        Globals.calls.push({channel: data_peer, peer: new_peer, status: 'disconnected', contact: contactKey});
        resolve(true);

        })
        .catch(error => {
        // Log error
        console.log(error);
        reject(false);
        });
    } else {

        new_peer = startPeer();
        data_peer = startPeer()
        new_peer.addStream(Globals.stream);
        Globals.calls.push({channel: data_peer, peer: new_peer, status: 'disconnected', contact: contactKey});
        resolve(true);

    }


});
}

export class CallScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { address, nickname, paymentID } = this.props.navigation.state.params.payee;

        const sdp  = this.props.navigation.state.params.sdp ? this.props.navigation.state.params.sdp : undefined;
        const activeCall = Globals.calls.find(call => call?.contact == paymentID);
        this.state = {
            address,
            nickname,
            paymentID,
            sdp,
            activeCall };

        }

    async componentDidMount() {



        if (!this.state.activeCall) {
            console.log('Initating WebRTC');
            const initiated = await initWebRTC(this.state.paymentID);

            this.state.activeCall = Globals.calls.find(call => call.contact == this.state.paymentID);            

            if (initiated) {
                this.setState({stream: Globals.stream})
                
                console.log('set state!')
                this.state.activeCall.peer.onicecandidate = event => {

                    // Add event handlers for ice candidate event
        
                };
    
            } else {
                toastPopUp('Failed to start WebRTC');
            }

        } else {

            this.setState(
                {
                    callStatus: this.state.activeCall.status, 
                    remoteStream: this.state.activeCall.remoteStream, 
                    stream: Globals.stream,
                    options: this.state.activeCall.options
                }
            );

        }


        this.state.activeCall.peer.onaddstream = event => {
            // Got stream
            this.state.activeCall.remoteStream = event.stream;
            this.setState({remoteStream: event.stream});
        };

        this.state.activeCall.peer.onconnectionstatechange = (ev) => {

            try {

            console.log('Connection change');
            this.state.activeCall.status = this.state.activeCall.peer.connectionState;
            this.setState({callStatus: this.state.activeCall.peer.connectionState});

            if(this.state.activeCall.peer.connectionState == 'disconnected') {
                this.disconnectCall();
            }
            if(this.state.activeCall.peer.connectionState == 'connected') {
                InCallManager.stopRingback();
            }
        } catch (err) {
            this.disconnectCall();
        }

        }
        
        // setup stream listening

        let callStatus = this.state.activeCall.status;

        if (callStatus == 'new' || !callStatus) {
            callStatus = 'disconnected';
        }

        if (this.state.sdp && callStatus == 'disconnected') {
            InCallManager.start({ media: 'audio/video', auto: true});
            InCallManager.startRingtone('_BUNDLE_');
        }

        const localWebcamOn = Globals.localWebcamOn;

        const localMicOn = Globals.localMicOn;

        const speakerOn = Globals.speakerOn;

        this.setState({selectedValue: 'video', callStatus: callStatus, localMicOn: localMicOn, localWebcamOn: localWebcamOn, speakerOn: speakerOn})

    }

    async componentWillUnmount() {


        if (this.state.callStatus == 'disconnected') {
        this.state.activeCall.peer.close();

          Globals.calls.splice(Globals.calls.indexOf(this.state.activeCall), 1);

          if(!Globals.calls?.length) {

            Globals.stream.getTracks().forEach(function(track) {
                track.stop();
              });
            Globals.stream = false;
          }

        }
        

    }

    async checkPeerIceState() {

        await new Promise((resolve) => {

            if (this.state.activeCall.peer.iceGatheringState === 'complete') {
              resolve();
            } else {
              this.state.activeCall.peer.addEventListener('icegatheringstatechange', () => {
                if (this.state.activeCall.peer.iceGatheringState === 'complete') {
                  resolve();
                }
              });
            }
          });

    }

    async signal(type, data) {
        
        let sessionDescription

        if (type === "new") {
            sessionDescription = await this.state.activeCall.peer.createOffer();
            
        } else if (type === "incoming") {
            
            await this.state.activeCall.peer.setRemoteDescription(data);

            sessionDescription = await this.state.activeCall.peer.createAnswer();
        }
        
        //Set local sdp
        await this.state.activeCall.peer.setLocalDescription(sessionDescription);
        
        await new Promise((resolve) => {
            if (this.state.activeCall.peer.iceGatheringState === 'complete') {
              resolve();
            } else {
                this.state.activeCall.peer.addEventListener('icegatheringstatechange', () => {
                if (this.state.activeCall.peer.iceGatheringState === 'complete') {
                  resolve();
                }
              });
            }
          });

        //Set Answer/Offer
        if (type === "new")  sessionDescription = await this.state.activeCall.peer.createOffer();
        if (type === "incoming")  {
            await this.state.activeCall.peer.setRemoteDescription(data);
            sessionDescription = await this.state.activeCall.peer.createAnswer();
        }

        let message = {
            type: sessionDescription.type,
            data: sessionDescription
        }

        this.sendDataMessage(message)
    }

    async sendDataMessage(message) {
        this.state.dataChannel.send(JSON.stringify(message))
    }

    async dataMessage(data) {
        let message
        try {
            message = JSON.parse(data)
        } catch(err) {
            Globals.logger.addLogMessage('[DataChannel] Error parsing data channel message: ' + data);
            return
        }
        Globals.logger.addLogMessage('[DataChannel] incoming: ' + JSON.stringify(message));
        const incomingCall = this.checkIncomingCall(message)
        if (incomingCall) return
        
        //Here we can receive data messages etc..
    }

    async checkIncomingCall(incoming) {
        if (incoming.type === "offer") {
            //Incoming offer
            this.signal("incoming", incoming.data)
            
        }else if (incoming.data.type === "renegotiate") {
            //Peer2 needs a new offer. Signal a new one
            this.signal("new", null)
        } 
        else if (incoming.type === "answer") {
            //Got answer
            this.state.activeCall.peer.setRemoteDescription(incoming.data);
        } else {
            //Not SDP, probably a message
            return false
        }

        return true
    }

    async startCall() {

        InCallManager.start({ media: 'audio/video', auto: true, ringback: '_DTMF_'});
        InCallManager.setSpeakerphoneOn(this.state.speakerOn);
        

        this.state.activeCall.status = 'waiting';
        this.setState({callStatus: 'waiting'});
        let data_channel = await this.state.activeCall.peer.createDataChannel('HuginDataChannel');
        let channel = await this.state.activeCall.channel.createDataChannel('DataChannel');
        this.setState({dataChannel: channel});

        channel.addEventListener("open", (event) => {
            //Create new offer to send via data channel
            this.signal("new", null)
          });

        channel.addEventListener("message", (event) => {this.dataMessage(event.data)});

        let sessionDescription = await this.state.activeCall.channel.createOffer();
    
        await this.state.activeCall.channel.setLocalDescription(sessionDescription);

        await new Promise((resolve) => {
            if (this.state.activeCall.channel.iceGatheringState === 'complete') {
              resolve();
            } else {
                this.state.activeCall.channel.addEventListener('icegatheringstatechange', () => {
                if (this.state.activeCall.channel.iceGatheringState === 'complete') {
                  resolve();
                }
              });
            }
          });

        sessionDescription = await this.state.activeCall.channel.createOffer();

        Globals.logger.addLogMessage('[Calls] SDP generated: ' + sessionDescription.sdp);
    
        await this.state.activeCall.channel.setLocalDescription(sessionDescription);
    
        let parsed_sdp = parse_sdp(sessionDescription);
    
        let parsed_data = 'Δ' + parsed_sdp;

        const reparsed_sdp = expand_sdp_offer(parsed_data);

        console.log('Data channel sdp reparsed: ' + reparsed_sdp);
        let receiver = this.state.address;
    
        let messageKey = this.state.paymentID;
        const temp_timestamp = Date.now();
        await saveMessage(receiver, 'processing', 'Call started', temp_timestam, 1);
        const result = await sendMessage(parsed_data, receiver, messageKey, temp_timestamp);    
        console.log(result);
        if (!result.success) {
            toastPopUp('Failed to send call! Check your balance and try again.');
        }
    
       }

    async answerCall() {

        InCallManager.stop();
        InCallManager.start({media: 'audio/video', ringback: '_DTMF_'});
        InCallManager.setSpeakerphoneOn(this.state.speakerOn);

        this.state.activeCall.status = 'connecting';
        this.setState({callStatus: 'connecting'});
        
        
        let channel = await this.state.activeCall.channel.createDataChannel('DataChannel');
        channel.addEventListener("message", (event) => {this.dataMessage(event.data)});
        this.setState({dataChannel: channel});

        const parsed_sdp = expand_sdp_offer(this.state.sdp);

        await this.state.activeCall.channel.setRemoteDescription(parsed_sdp);
        
        let answer = await this.state.activeCall.channel.createAnswer();

        await this.state.activeCall.channel.setLocalDescription(answer);

        await new Promise((resolve) => {

            if (this.state.activeCall.channel.iceGatheringState === 'complete') {
              resolve();
            } else {
              this.state.activeCall.channel.addEventListener('icegatheringstatechange', () => {
                if (this.state.activeCall.channel.iceGatheringState === 'complete') {
                  resolve();
                }
              });
            }
          });

        await this.state.activeCall.channel.setRemoteDescription(parsed_sdp);

        answer = await this.state.activeCall.channel.createAnswer();

        await this.state.activeCall.channel.setLocalDescription(answer);

        Globals.logger.addLogMessage('[Calls] SDP generated: ' + answer.sdp);

        const parsed_answer = 'δ' + parse_sdp(answer, true);

        const reparsed_answer = expand_sdp_answer(parsed_answer);

        const receiver = this.state.address;
    
        const messageKey = this.state.paymentID;

        const temp_timestamp = Date.now();
        await saveMessage(receiver, 'processing', 'Call answered', temp_timestamp,1);
        const result = await sendMessage(parsed_answer, receiver, messageKey, temp_timestamp);   

    }

    async disconnectCall() {

        const { t } = this.props;

        InCallManager.stop();

        this.state.activeCall.peer.close();

        this.state.activeCall.channel.close();

        this.setState({activeCall: null});
    
        this.props.navigation.goBack();

        Globals.calls.splice(Globals.calls.indexOf(this.state.activeCall), 1);
        if(!Globals.calls.length) {
            Globals.stream.getTracks().forEach(function(track) {
                track.stop();
              });
            Globals.stream = false;
        }
        toastPopUp(t('callTerminated'))

    }

      // Switch Camera
  switchCamera() {
    this.state.stream.getVideoTracks().forEach((track) => {
      track._switchCamera();
    });
  }

  // Enable/Disable Camera
  toggleCamera() {
    this.state.localWebcamOn ? Globals.localWebcamOn = false : Globals.localWebcamOn = true;
    this.state.localWebcamOn ? this.setState({localWebcamOn: false}) : this.setState({localWebcamOn: true});
    this.state.stream.getVideoTracks().forEach((track) => {
      this.state.localWebcamOn ? (track.enabled = false) : (track.enabled = true);
    });
  }

  // Enable/Disable Mic
    toggleMic() {
    this.state.localMicOn ? Globals.localMicOn = false : Globals.localMicOn = true;
    this.state.localMicOn ? this.setState({localMicOn: false}) : this.setState({localMicOn: true});

    this.state.stream.getAudioTracks().forEach((track) => {
        this.state.localMicOn ? (track.enabled = false) : (track.enabled = true);
    });
    }

    toggleSpeaker() {
        this.state.speakerOn ? InCallManager.setSpeakerphoneOn(false) : InCallManager.setSpeakerphoneOn(true);
        this.setState({speakerOn: !this.state.speakerOn});
        Globals.speakerOn = !Globals.speakerOn;
        this.state.speakerOn ? Globals.speakerOn = false : Globals.speakerOn = true;
    }

    // Switch Camera
  switchCamera() {
    this.state.stream.getVideoTracks().forEach((track) => {
      track._switchCamera();
    });
  }

    render() {

      markConversationAsRead(this.state.address);

       const { t } = this.props;

       const items = [];


        const preCallStyleUser = {
            position: 'absolute',
            width: '100%',
            height: '100%',
        }
        const postCallStyleUser = {
            position: 'absolute',
            width: 150,
            height: 110,
            bottom: 90,
            left: '7.5%'
        }
        

       for (message in this.state.messages) {
         if (this.state.address == this.state.messages[message].conversation){
           let timestamp = this.state.messages[message].timestamp / 1000;
           if (this.state.messages[message].type == 'received'){
              items.push(<View  key={message} style={{alignSelf: 'flex-start', marginLeft: 20, marginRight: 20, marginBottom: 20, backgroundColor: '#2C2C2C', padding: 15, borderRadius: 15}}><Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{this.state.messages[message].message}</Text><Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment></View>)
           } else {
             items.push(<View  key={message} style={{alignSelf: 'flex-end', marginLeft: 20, marginRight: 20, marginBottom: 20, backgroundColor: '#006BA7', padding: 15, borderRadius: 15}}><Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{this.state.messages[message].message}</Text><Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment></View>)
           }

       }
       }


        return(
            <View style={{
                flex: 1,
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                alignItems: 'center',
                paddingLeft: 10
            }}>

                <View style={{
                    alignItems: 'center',
                    marginHorizontal: 30,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 5,
                        marginLeft: 'auto'
                    }}>
                        <Image
                          style={{width: 50, height: 50}}
                          source={{uri: get_avatar(this.state.address)}}
                        />
                        <Text onPress={() => {
                            this.props.navigation.navigate(
                                'ModifyPayee', {
                                    payee: this.props.navigation.state.params.payee,
                                }
                            );
                        }} style={{ fontSize: 18, color: this.props.screenProps.theme.primaryColour, fontFamily: 'Montserrat-SemiBold' }}>
                            {this.state.nickname}
                        </Text>
                    </View>
                </View>

                <View style={{
                    width: '100%',
                    alignItems: 'center',
                }}>

                </View>
                
              {(this.state.callStatus != 'connected') &&
              
              <View style={ [preCallStyleUser,
                {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 5,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor:  '#252525'
                }]
                }>
              <Image
                      style={{width: 150, height: 150, position: 'absolute', alignSelf: 'center', top: '40%'}}
                      source={{uri: get_avatar(Globals.wallet.getPrimaryAddress(), 150)}}
                  />
                  { this.state.stream && this.state.localWebcamOn &&
                  <RTCView
                    objectFit={"cover"}
                    mirror={true}
                    style={{ flex: 1, backgroundColor: "#050A0E" }}
                    streamURL={this.state.stream.toURL()} />
                  }
                   <View style={{
                      position: 'absolute',
                      bottom: 5,
                      left: 5,
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      borderRadius: 3,
                      overflow: 'hidden',
                      padding: 3
                  }}>
                     <Text style={{color: 'black'}}>{Globals.preferences.nickname}</Text>
                  </View>
                  {(!this.state.localMicOn || !this.state.localWebcamOn) &&
                  <View style={{
                      justifyContent: 'space-between',
                      flexDirection: 'row',
                      position: 'absolute',
                      bottom: 5,
                      right: 5,
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      borderRadius: 3,
                      overflow: 'hidden',
                      padding: 3
                  }}>
                      {!this.state.localMicOn &&
                      <CustomIcon name='microphone-slash' size={18} style={{color: 'rgba(0,0,0,0.8)'}} />
                      }
                      {!this.state.localMicOn && !this.state.localWebcamOn &&
                      <View style={{width: 5}}></View>
                      }
                      {!this.state.localWebcamOn &&
                      <CustomIcon name='camera-slash' size={18} style={{color: 'rgba(0,0,0,0.8)'}} />
                      }
                  </View>
                  }
  
                </View>

              }
    
              { this.state.callStatus == 'connected' &&
            <>
              <View style={[preCallStyleUser, {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 5,
                overflow: 'hidden',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor:  '#252525',
              }]}>
                <Image
                          style={{width: 150, height: 150, position: 'absolute', left: 75, top: 35}}
                          source={{uri: get_avatar(this.state.address, 150)}}
                        />
                    { this.state.remoteStream &&
                    <RTCView
                    objectFit={"cover"}
                    style={[(this.state.remoteStream.getVideoTracks().length ? {opacity: 1} : {opacity: 0}),{ flex: 1, backgroundColor: "#050A0E" }]}
                    streamURL={this.state.remoteStream.toURL()} />
                    } 
                 <View style={{
                    position: 'absolute',
                    bottom: 5,
                    left: 5,
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    padding: 3
                 }}>
                    <Text style={{color: 'black'}}>{this.state.nickname}</Text>
                </View>
                </View>

<View style={ [postCallStyleUser,
    {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 5,
      overflow: 'hidden',
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor:  '#252525',
    }]
    }>
  <Image
          style={{width: 50, height: 50, position: 'absolute', left: 50, top: 30}}
          source={{uri: get_avatar(Globals.wallet.getPrimaryAddress(), 50)}}
      />
      { this.state.stream && this.state.localWebcamOn &&
      <RTCView
        objectFit={"cover"}
        mirror={true}
        style={{ flex: 1, backgroundColor: "#050A0E" }}
        streamURL={this.state.stream.toURL()} />
      }
       <View style={{
          position: 'absolute',
          bottom: 5,
          left: 5,
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: 3,
          overflow: 'hidden',
          padding: 3
      }}>
         <Text style={{color: 'black'}}>{Globals.preferences.nickname}</Text>
      </View>
      {(!this.state.localMicOn || !this.state.localWebcamOn) &&
      <View style={{
          justifyContent: 'space-between',
          flexDirection: 'row',
          position: 'absolute',
          bottom: 5,
          right: 5,
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: 3,
          overflow: 'hidden',
          padding: 3
      }}>
          {!this.state.localMicOn &&
          <CustomIcon name='microphone-slash' size={18} style={{color: 'rgba(0,0,0,0.8)'}} />
          }
          {!this.state.localMicOn && !this.state.localWebcamOn &&
          <View style={{width: 5}}></View>
          }
          {!this.state.localWebcamOn &&
          <CustomIcon name='camera-slash' size={18} style={{color: 'rgba(0,0,0,0.8)'}} />
          }
      </View>
      }

    </View>
    </>
    
        }


        
        {this.state.stream &&
        <View
        style={{
          backgroundColor: '#171717',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor:  '#252525',
          position: 'absolute',
          bottom: 40,
          width: '85%',
          justifyContent: 'space-between',
          borderRadius: 5,
          overflow: 'hidden',
          padding: 10,
          flexDirection: 'row',
        }}>
  
          {this.state.localWebcamOn ? 
              <TouchableOpacity onPress={() =>{this.toggleCamera()}}>
              <CustomIcon name='camera-slash' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
               :
               <TouchableOpacity onPress={() =>{this.toggleCamera()}}>
              <CustomIcon name='camera' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
          }
  
          <TouchableOpacity onPress={() =>{this.switchCamera()}}>
              <CustomIcon name='repeate-music' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
          </TouchableOpacity>
  
          {this.state.localMicOn ? 
              <TouchableOpacity onPress={() =>{this.toggleMic()}}>
              <CustomIcon name='microphone-slash' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
               :
               <TouchableOpacity onPress={() =>{this.toggleMic()}}>
              <CustomIcon name='microphone-2' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
          }

          {this.state.speakerOn ? 
              <TouchableOpacity onPress={() =>{ this.toggleSpeaker() }}>
              <CustomIcon name='volume-low' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
               :
               <TouchableOpacity onPress={() =>{  this.toggleSpeaker() }}>
              <CustomIcon name='volume-cross' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
          }
  
          {this.state.callStatus == 'disconnected' && !this.state.sdp &&
              <TouchableOpacity onPress={() =>{this.startCall()}}>
                  
                  <CustomIcon name='call' size={24} style={{color: '#5ff281'}} />
                  
              </TouchableOpacity>
          }
  
          { this.state.sdp && this.state.callStatus == 'disconnected' &&
               <TouchableOpacity onPress={() =>{this.answerCall()}}>
                  <CustomIcon name='call' size={24} style={{color: '#5ff281'}} />
             </TouchableOpacity>
          }
  
          { this.state.callStatus != 'disconnected' && this.state.callStatus != 'failed' &&
  
              <TouchableOpacity onPress={() =>{this.disconnectCall()}}>
              <CustomIcon name='call-slash' size={24} style={{color: '#EA3323'}} />
              </TouchableOpacity>
  
          }
  
      </View>
        }
      
    { this.state.callStatus != 'connected' && 
    <View style={{
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor:  '#252525',
        position: 'absolute',
        top: 50,
        borderRadius: 5,
        padding: 10,
        color: 'black',
        textAlign: 'center',
        flexDirection: 'row'
    }}>
    { this.state.sdp && this.state.callStatus == 'disconnected' &&
    <Text>{this.state.nickname + t('isCalling')}</Text>
    }
    { this.state.stream && !this.state.sdp && this.state.callStatus == 'disconnected' &&
    <Text>{t('tapToCall') + ' ' + this.state.nickname + '.'}</Text>
    }
    { !this.state.stream &&
    <Text>{t('noRecordAccess')}</Text>
    }
    { this.state.callStatus == 'waiting' &&
    <><Text>{t('waitingForAnswer')}</Text><ActivityIndicator /></>
    }
    { this.state.callStatus == 'connecting' &&
    <><Text>{t('connecting')}</Text><ActivityIndicator /></>
    }
    {/* { this.state.callStatus == 'connected' &&
        <Text>{"Connected"}</Text>
    } */}
    </View>}

            </View>
        );
    }
}

export const CallScreen = withTranslation()(CallScreenNoTranslation)
