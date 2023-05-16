// Copyright (C) 2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import { checkText } from 'smile2emoji';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import {
    Picker, Keyboard, KeyboardAvoidingView, View, Text, TextInput, ScrollView, FlatList, Platform, TouchableWithoutFeedback, TouchableOpacity, Image
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

import { Styles } from './Styles';

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

import { saveToDatabase, getMessages, getLatestMessages, removeMessage, markConversationAsRead, loadPayeeDataFromDatabase } from './Database';

import './i18n.js';
import { withTranslation } from 'react-i18next';

import {AutoGrowingTextInput} from 'react-native-autogrow-textinput';

import CustomIcon from './CustomIcon.js'

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
            payees: Globals.payees,
            index: 0,
        }

        Globals.updatePayeeFunctions.push(() => {
            this.setState(prevState => ({
                payees: Globals.payees,
                index: prevState.index + 1,
            }))
        });
    }

    render() {
        const { t } = this.props;
        const payees = this.state.payees;
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
                                subtitle={item.lastMessage ? <Text><Text style={{fontFamily: 'Montserrat-Regular'}}>{item.lastMessage}{"\n"}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.lastMessageTimestamp/1000}</Moment></Text> : t('noMessages')}
                                subtitleStyle={{
                                    fontFamily: "Montserrat-Regular"
                                }}
                                chevron={item.read == '1' ? false : newMessageIndicator }
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
                                        payees: Globals.payees
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
                    <TouchableWithoutFeedback
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

                            <View style={{
                                height: 37,
                                width: 37,
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

                        </View>
                    </TouchableWithoutFeedback>


                    <View style={{
                        backgroundColor: this.props.screenProps.theme.backgroundColour,
                        flex: 1,
                        marginRight: 15,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}>

                        {this.state.payees.length > 0 ? addressBookComponent : noPayeesComponent}

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
            messageHasLength: false
        }


        Globals.updateChatFunctions.push(() => {
            this.setState({
                messages: Globals.messages
            })
        });

    }

    async componentDidMount() {

        const messages = await getMessages(this.state.address);

        this.setState({
          messages: messages
        });

        Globals.activeChat = this.state.address;

    }

    async componentWillUnmount() {

        Globals.activeChat = '';

    }

    render() {

      markConversationAsRead(this.state.address);

       const { t } = this.props;

       const items = [];

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


           const submitMessage = async (text) => {

             Keyboard.dismiss();

             let updated_messages = await getMessages();
             if (!updated_messages) {
               updated_messages = [];
             }
             let temp_timestamp = Date.now();
             updated_messages.push({
                 conversation: this.state.address,
                 type: 'sent',
                 message: checkText(text),
                 timestamp: temp_timestamp
             });

             this.setState({
               messages: updated_messages,
               messageHasLength: false
             });

             this.state.input.current._textInput.clear();

             this.setState({messageHasLength: this.state.message.length > 0});

             let success = await sendMessage(checkText(text), this.state.address, this.state.paymentID);
             await removeMessage(temp_timestamp);
             if (success) {
             let updated_messages = await getMessages();

               this.setState({
                 messages: updated_messages,
                 messageHasLength: false
               })
               // this.state.input.current.clear();
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
                        <View style={{flex: 1}}>
                        <Text onPress={() => {
                            this.props.navigation.navigate(
                                'CallScreen', {
                                    payee: this.props.navigation.state.params.payee,
                                    // sdp: 'wtfdoe'
                                }
                            );
                        }} style={{ textAlign: 'right', fontSize: 18, color: this.props.screenProps.theme.primaryColour, fontFamily: 'Montserrat-SemiBold' }}>
                            {'Call'}
                        </Text>
                        </View>

                    </View>
                </View>

                <View style={{
                    width: '100%',
                    alignItems: 'center',
                }}>

                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{
                        marginRight: 30,
                        marginBottom: 0,
                        width: '100%',
                        height: '80%',
                    }}
                    ref={ref => {this.scrollView = ref}}
                    onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}
                >

                {items}

                </ScrollView>

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

export class CallScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { address, nickname, paymentID } = this.props.navigation.state.params.payee;

        const sdp  = this.props.navigation.state.params.sdp ? this.props.navigation.state.params.sdp : undefined;


        let isFront = false;
        let videoSourceId;
        mediaDevices.enumerateDevices().then(sourceInfos => {
    
    for (let i = 0; i < sourceInfos.length; i++) {
      console.log('Checking for cam..');
      const sourceInfo = sourceInfos[i];
      console.log(sourceInfo);
      if (
        sourceInfo.kind == 'videoinput' &&
        sourceInfo.facing == (isFront ? 'user' : 'environment')
      ) {
        videoSourceId = sourceInfo.deviceId;
      }
      console.log(videoSourceId);
    }
    });

    mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then(stream => {
          console.log('We have stream')
          // Get local stream!
          let new_peer = new RTCPeerConnection( {
            iceServers: [
            {
              urls: [
                'stun:stun.l.google.com:19302',
                'stun:global.stun.twilio.com:3478'
              ]
            }
          ],
          iceTransportPolicy: "all",
          sdpSemantics: 'unified-plan',
        //   trickle: false
        });
        
          this.setState({stream: stream, peer: new_peer});    
          console.log(this.state.stream);    
          console.log(this.state.peer);    

          this.state.peer.onicecandidate = event => {

            // Add event handlers for ice candidate event

          };

          this.state.peer.onaddstream = event => {
            // Got stream
            this.setState({remoteStream: event.stream});
          };

          this.state.peer.onconnectionstatechange = (ev) => {

            console.log('Connection change');
            console.log(this.state.peer);
            this.setState({callStatus: this.state.peer.connectionState});

            if(this.state.peer.connectionState == 'disconnected') {
                this.disconnectCall();
            }

          }

          this.state.peer.addStream(this.state.stream);

          // setup stream listening

          console.log(sessionDescription);

        })
        .catch(error => {
          // Log error
        });

        const callStatus = 'disconnected';

        const localWebcamOn = true;

        const localMicOn = true;

        this.state = {
            address,
            nickname,
            paymentID,
            sdp,
            callStatus,
            localMicOn,
            localWebcamOn
        }

        this.setState({selectedValue: 'video'})

        Globals.updateCallFunctions.push(() => {

            console.log('Globals.sdp_answer', Globals.sdp_answer);

            this.setState({sdp_answer: Globals.sdp_answer});

            this.addAnswer();

        });

    }

    addAnswer() {
        console.log('this.state.sdp_answer', Globals.sdp_answer);
        const expanded_answer = expand_sdp_answer(Globals.sdp_answer);
        console.log('expanded_answer',expanded_answer);
        this.state.peer.setRemoteDescription(expanded_answer);
    }

    async componentDidMount() {

        // const messages = await getMessages(this.state.address);

        // this.setState({
        //   messages: messages
        // });

        // Globals.activeChat = this.state.address;

    }

    async componentWillUnmount() {

        // Globals.activeChat = '';

    }

    async startCall() {

        this.setState({callStatus: 'waiting'});

        await this.state.peer.createDataChannel('HuginDataChannel');

        let sessionDescription = await this.state.peer.createOffer();
    
        await this.state.peer.setLocalDescription(sessionDescription);

        await new Promise((resolve) => {
            if (this.state.peer.iceGatheringState === 'complete') {
              resolve();
            } else {
              this.state.peer.addEventListener('icegatheringstatechange', () => {
                if (this.state.peer.iceGatheringState === 'complete') {
                  resolve();
                }
              });
            }
          });

        sessionDescription = await this.state.peer.createOffer();
    
        await this.state.peer.setLocalDescription(sessionDescription);

        console.log(sessionDescription);
    
        let parsed_sdp = parse_sdp(sessionDescription);
    
        let parsed_data = 'Δ' + parsed_sdp;
    
        console.log(parsed_data);

        const reparsed_sdp = expand_sdp_offer(parsed_data);

        console.log(reparsed_sdp);

        // await this.state.peer.setLocalDescription(reparsed_sdp);
    
        // let expanded_data = expand_sdp_offer(parsed_data);
    
        // console.log(expanded_data);
    
        let receiver = this.state.address;
    
        let messageKey = this.state.paymentID;
    
        sendMessage(parsed_data, receiver, messageKey);    
    
       }

    async answerCall() {

        console.log(this.state.sdp);
        
        const parsed_sdp = expand_sdp_offer(this.state.sdp);

        console.log(parsed_sdp);

        await this.state.peer.setRemoteDescription(parsed_sdp);

        let answer = await this.state.peer.createAnswer();

        await this.state.peer.setLocalDescription(answer);

        await new Promise((resolve) => {
            console.log(this.state.peer.iceGatheringState);
            console.log(this.state.peer);
            if (this.state.peer.iceGatheringState === 'complete') {
              resolve();
            } else {
              this.state.peer.addEventListener('icegatheringstatechange', () => {
                if (this.state.peer.iceGatheringState === 'complete') {
                  resolve();
                }
              });
            }
          });
          console.log('Ice candidates is working, yay!', this.state.peer)
        // SEND VARIABLE 'answer' TO CALLER

        await this.state.peer.setRemoteDescription(parsed_sdp);

        answer = await this.state.peer.createAnswer();
        
        console.log(answer);

        await this.state.peer.setLocalDescription(answer);
          console.log('Parsing sdp..')
        const parsed_answer = 'δ' + parse_sdp(answer, true);

        console.log(parsed_answer);
        
        const reparsed_answer = expand_sdp_answer(parsed_answer);

        console.log(reparsed_answer);

        const receiver = this.state.address;
    
        const messageKey = this.state.paymentID;
        
        sendMessage(parsed_answer, receiver, messageKey);    


          

    }

    async disconnectCall() {

        this.state.peer.close();
        this.state.stream.getTracks().forEach(function(track) {
            track.stop();
          });
        this.props.navigation.navigate(
            'ChatScreen', {
                payee: this.props.navigation.state.params.payee,
            });
        toastPopUp('Call terminated..')

    }

      // Switch Camera
  switchCamera() {
    this.state.stream.getVideoTracks().forEach((track) => {
      track._switchCamera();
    });
  }

  // Enable/Disable Camera
  toggleCamera() {
    this.state.localWebcamOn ? this.setState({localWebcamOn: false}) : this.setState({localWebcamOn: true});
    this.state.stream.getVideoTracks().forEach((track) => {
      this.state.localWebcamOn ? (track.enabled = false) : (track.enabled = true);
    });
  }

  // Enable/Disable Mic
    toggleMic() {
    this.state.localMicOn ? this.setState({localMicOn: false}) : this.setState({localMicOn: true});
    this.state.stream.getAudioTracks().forEach((track) => {
        this.state.localMicOn ? (track.enabled = false) : (track.enabled = true);
    });
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


           const submitMessage = async (text) => {

             Keyboard.dismiss();

             let updated_messages = await getMessages();
             if (!updated_messages) {
               updated_messages = [];
             }
             let temp_timestamp = Date.now();
             updated_messages.push({
                 conversation: this.state.address,
                 type: 'sent',
                 message: checkText(text),
                 timestamp: temp_timestamp
             });

             this.setState({
               messages: updated_messages,
               messageHasLength: false
             });

             this.state.input.current._textInput.clear();

             this.setState({messageHasLength: this.state.message.length > 0});

             let success = await sendMessage(checkText(text), this.state.address, this.state.paymentID);
             await removeMessage(temp_timestamp);
             if (success) {
             let updated_messages = await getMessages();

               this.setState({
                 messages: updated_messages,
                 messageHasLength: false
               })
               // this.state.input.current.clear();
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
                
              <View style={{
                width: 300,
                height: 220,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 5,
                overflow: 'hidden',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor:  '#252525',
              }}>
            <Image
                    style={{width: 150, height: 150, position: 'absolute', left: 75, top: 35}}
                    source={{uri: get_avatar(Globals.wallet.getPrimaryAddress(), 150)}}
                />
                { this.state.stream && this.state.localWebcamOn &&
                <RTCView
                  objectFit={"cover"}
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
    
              { this.state.stream && this.state.callStatus != 'disconnected' &&

              <View style={{
                marginTop: 10,
                width: 300,
                height: 220,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 5,
                overflow: 'hidden',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor:  '#252525',
              }}>
                <Image
                          style={{width: 150, height: 150, position: 'absolute', left: 75, top: 35}}
                          source={{uri: get_avatar(this.state.address, 150)}}
                        />
                    { this.state.remoteStream &&
                    <RTCView
                    objectFit={"cover"}
                    style={{ flex: 1, backgroundColor: "#050A0E" }}
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
    
        }
        
        {this.state.stream &&
        <View
        style={{
          backgroundColor: '#171717',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor:  '#252525',
          position: 'absolute',
          bottom: 20,
          width: 300,
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
  
          {this.state.callStatus == 'disconnected' && !this.state.sdp &&
              <TouchableOpacity onPress={() =>{this.startCall()}}>
                  
                  <CustomIcon name='call' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
                  
              </TouchableOpacity>
          }
  
          { this.state.sdp && this.state.callStatus == 'disconnected' &&
               <TouchableOpacity onPress={() =>{this.answerCall()}}>
                  <CustomIcon name='call' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
             </TouchableOpacity>
          }
  
          { this.state.callStatus != 'disconnected' && this.state.callStatus != 'failed' &&
  
              <TouchableOpacity onPress={() =>{this.disconnectCall()}}>
              <CustomIcon name='call-slash' size={24} style={{color: 'rgba(255,255,255,0.8)'}} />
              </TouchableOpacity>
  
          }
  
      </View>
        }
      
    <View style={{width: 200}}>
    { this.state.sdp && this.state.callStatus == 'disconnected' &&
    <Text>{this.state.nickname + ' is calling. Tap the phone icon to answer.'}</Text>
    }
    { this.state.stream && !this.state.sdp && this.state.callStatus == 'disconnected' &&
    <Text>{'Tap the phone icon to call ' + this.state.nickname + '.'}</Text>
    }
    { !this.state.stream &&
    <Text>{"No access to camera and/or microphone. Please allow them in your phone's settings to make calls."}</Text>
    }
    </View>

        {/* <Text>{this.state.callStatus)}</Text> */}


            </View>
        );
    }
}

export const CallScreen = withTranslation()(CallScreenNoTranslation)
