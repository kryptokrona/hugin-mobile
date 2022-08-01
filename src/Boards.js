// Copyright (C) 2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import { checkText } from 'smile2emoji';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import {
    Keyboard, KeyboardAvoidingView, View, Text, TextInput, ScrollView, FlatList, Platform, TouchableWithoutFeedback, Image
} from 'react-native';

import {
    validateAddresses, WalletErrorCode, validatePaymentID,
} from 'kryptokrona-wallet-backend-js';

import { Button as RNEButton, Alert, Modal, TouchableOpacity} from 'react-native';

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


import {intToRGB, hashCode, get_avatar, sendBoardsMessage} from './HuginUtilities';

import {toastPopUp} from './Utilities';

import { getBoardSubscriptions, subscribeToBoard, markBoardsMessageAsRead, saveToDatabase, getBoardsMessages, getLatestMessages, removeMessage, markConversationAsRead, loadPayeeDataFromDatabase, removeBoard } from './Database';

import './i18n.js';
import { withTranslation } from 'react-i18next';

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

export class BoardsHomeScreenNoTranslation extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            messages: Globals.boardsMessages,
            index: 0,
            board: 'Home',
            modalVisible: false,
            editingBoards: false,
            isSubscribedToBoard: false
        }

        Globals.updateBoardsFunctions.push(() => {
            this.setState({
                messages: Globals.boardsMessages
            })
        });
    }

    async componentDidMount() {

        const this_messages = await getBoardsMessages(this.state.board);

        const boardsSubscriptions = [{board: 'Home', key: 0}].concat(Globals.boardsSubscriptions);
        // console.log(boardsSubscriptions);
        // boardsSubscriptions.append({board: 'Home', key: '0'});

        this.setState({
          messages: this_messages,
          boardssubscriptions: boardsSubscriptions,
          isSubscribedToBoard: true
        });

        Globals.activeChat = this.state.address;


        let i = 0;

        while (i < this_messages.length) {

          i++;
          let this_msg = this_messages[i];
          console.log(this_msg);
          let this_hash = this_msg.hash;
          console.log(this_hash);
          if(!this_msg.read) {
              markBoardsMessageAsRead(this_hash);
          }


        }

    }

    setModalVisible = (visible) => {
      this.setState({ modalVisible: visible });
    }

    setEditingMode = (editing) => {
      this.setState({ editingBoards: editing })
    }

    render() {

      const { modalVisible, editingBoards } = this.state;

      const isSubscribedTo = (board) => {

        if (!boardsSubscriptionsItems) {
          return;
        }

        let sub = boardsSubscriptionsItems.filter(item => {return item.board == board});

        const result = sub.length > 0 ? true : false;

        return result;

      }

      const submitMessage = async (text) => {

        Keyboard.dismiss();

        let updated_messages = await getBoardsMessages(this.state.board);
        if (!updated_messages) {
          updated_messages = [];
        }
        let temp_timestamp = parseInt(Date.now() / 1000);
        updated_messages.unshift({
            board: this.state.board,
            address: Globals.wallet.getPrimaryAddress(),
            message: checkText(text),
            timestamp: temp_timestamp,
            hash: temp_timestamp.toString(),
            read: 1,
            nickname: Globals.preferences.nickname
        });

        this.setState({
          messages: updated_messages,
          messageHasLength: false,
          message: ''
        });

        let success = await sendBoardsMessage(checkText(text), this.state.board, this.state.paymentID);


        // await removeMessage(temp_timestamp);
        if (success.success) {

          this.input.clear();

          this.setState({messageHasLength: this.state.message.length > 0});
          // this.state.input.current.clear();
        } else {
          updated_messages = await getBoardsMessages(this.state.board);

            this.setState({
              messages: updated_messages,
              messageHasLength: true
            })

        }
      }

        const getBoard = async (board) => {
          const board_messages = await getBoardsMessages(board);
          this.setModalVisible(false);
          this.setState({
              board: board,
              messages: board_messages
          });
        }

        const deleteBoard = async (board) => {
          let newBoardsSubscriptions = this.state.boardssubscriptions;
          newBoardsSubscriptions = newBoardsSubscriptions.filter(item => { return item.board != board});
          removeBoard(board);
          this.setState({
              boardssubscriptions: newBoardsSubscriptions
          });
        }


        const { t } = this.props;
        const messages = this.state.messages;
        const boardsSubscriptionsItems = this.state.boardssubscriptions;

        const board = this.state.board;
        this.state.isSubscribedToBoard = isSubscribedTo(this.state.board);
        const noMessagesComponent =
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

          const items =
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
                          removeClippedSubviews={false}
                          extraData={this.state.index}
                          ItemSeparatorComponent={null}
                          data={messages}
                          keyExtractor={item => item.hash}
                          renderItem={({item}) => (
                              <ListItem
                                  title={item.nickname ? item.nickname + " in " + item.board : 'Anonymous in ' + item.board}
                                  subtitle={<Text selectable><Text selectable>{item.message + "\n"}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.timestamp}</Moment></Text>}
                                  subtitleStyle={{
                                      fontFamily: "Montserrat-Regular",
                                      overflow: 'hidden'
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

                                      getBoard(item.board);

                                      // let messages = await getBoardsMessages(board);
                                      //
                                      // this.setState({
                                      //     board: item.board,
                                      //     messages: messages
                                      // });
                                      // this.props.navigation.navigate(
                                      //     'ChatScreen', {
                                      //         payee: item,
                                      //     }
                                      // );
                                      // await markBoardMessageAsRead(item.address);
                                      // Globals.payees = await loadPayeeDataFromDatabase();
                                      // this.setState({
                                      //     payees: Globals.payees
                                      // });
                                  }}
                              />
                          )}
                      />
              </ScrollView>;

        const messageComponent =
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

                {items}

            </ScrollView>;


        const boardsSubscriptions =
            <ScrollView
            showsVerticalScrollIndicator={false}
             style={{
                width: '100%',
                height: '100%',
                marginBottom: 20,
                borderWidth: 0,
                borderColor: 'transparent',
                backgroundColor: 'transparent'
            }}>
                    <FlatList
                        extraData={this.state.index}
                        ItemSeparatorComponent={null}
                        data={boardsSubscriptionsItems}
                        keyExtractor={item => item.board}
                        style={{backgroundColor: 'transparent'}}
                        renderItem={({item}) => (
                            <ListItem
                                title={item.board}
                                titleStyle={{
                                    color: '#ffffff',
                                    fontFamily: 'Montserrat-SemiBold'
                                }}
                                leftIcon={!editingBoards || item.board == 'Home' ? <View style={{
                                    width: 50,
                                    height: 50,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: this.props.screenProps.theme.iconColour,
                                    borderRadius: 45
                                }}>
                                    <Text style={[Styles.centeredText, {
                                        fontSize: 30,
                                        color: 'white',
                                    }]}>
                                        {item.board[0].toUpperCase()}
                                    </Text>

                                </View> :
                                <View style={{
                                    width: 50,
                                    height: 50,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#FF5F57',
                                    borderRadius: 45
                                }}>
                                    <Text style={[Styles.centeredText, {
                                        fontSize: 30,
                                        color: 'white',
                                        lineHeight: 50
                                    }]}>
                                      -
                                    </Text>

                                </View>
                                }
                                showsVerticalScrollIndicator={false}
                                onPress={async () => {
                                    !editingBoards || item.board == 'Home' ?
                                    getBoard(item.board)
                                    :
                                    deleteBoard(item.board)

                                }}
                            />
                        )}
                    />
            </ScrollView>;

            const boardsSubscriptionsComponent =
                <ScrollView
                showsVerticalScrollIndicator={false}
                 style={{
                    width: '160%',
                    height: '70%',
                    marginBottom: 20,
                    marginTop: 20,
                    marginLeft: '-30%',
                    borderWidth: 0,
                    borderColor: 'transparent'
                }}>

                    {boardsSubscriptions}

                </ScrollView>;

            const messageInput =
            <View
            style={{
                width: this.state.messageHasLength ? '80%' : '100%',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderWidth: 0,
                  borderColor: 'transparent',
                  borderRadius: 15,
                  height: 50
              }}
            >
            <TextInput
                multiline={true}
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
                maxLength={Config.integratedAddressLength}
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
            </View>;

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
                            this.setModalVisible(true)
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
                                {t('boardsTitle')}
                            </Text>



                            <Text style={{
                                marginLeft: 15,
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 16,
                                fontFamily: "Montserrat-SemiBold"
                            }}>
                                {board}
                            </Text>

                            {!this.state.isSubscribedToBoard &&
                              <TouchableWithoutFeedback
                                  onPress={() => {
                                      if ( isSubscribedTo(board) ) {
                                        return;
                                      }
                                      this.setState({isSubscribedToBoard: true});
                                      subscribeToBoard(board, 0);
                                      const subs = this.state.boardssubscriptions;
                                      subs.push({board: board,key: 0});
                                      this.state.boardssubscriptions = subs;
                                  }}
                              >
                              <Text style={{
                                  marginLeft: 15,
                                  color: this.props.screenProps.theme.primaryColour,
                                  fontSize: 16,
                                  fontFamily: "Montserrat-SemiBold"
                              }}>
                                  {t('subscribe')}
                              </Text>
                              </TouchableWithoutFeedback>
                            }


                        </View>
                    </TouchableWithoutFeedback>

                    <KeyboardAvoidingView
                     behavior={Platform.OS == "ios" ? "padding" : "height"}
                     style={{
                        marginHorizontal: 10,
                        marginBottom: 5,
                        flexDirection: 'row'
                    }}>

                        {this.state.board && messageInput}

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

                    <View>
                      <Modal
                        style={{}}
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => {
                          this.setModalVisible(!modalVisible);
                        }}
                      >
                        <View style={{
                          margin: 20,
                          backgroundColor: "#333",
                          borderRadius: 20,
                          padding: 25,
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: {
                            width: 0,
                            height: 2
                          },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 5
                        }}>
                          <View>
                            <Text style={{
                                marginLeft: 15,
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 24,
                                fontFamily: "Montserrat-SemiBold"
                            }}>My Boards
                            </Text>
                            <TextInput
                                multiline={false}
                                textAlignVertical={'top'}
                                ref={boardinput => { this.boardinput = boardinput }}
                                style={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontFamily: 'Montserrat-Regular',
                                    fontSize: 15,
                                    padding: 15,
                                    background: 'magenta',
                                    marginBottom: 15

                                }}
                                maxLength={20}
                                placeholder={'Add new board..'}
                                placeholderTextColor={'#ffffff'}
                                onSubmitEditing={async (e) => {
                                  e.preventDefault();

                                  subscribeToBoard(this.state.boardinput, 0);

                                  const subs = this.state.boardssubscriptions;
                                  subs.push({board: this.state.boardinput,key: 0});

                                  this.state.boardssubscriptions = subs;
                                  this.setModalVisible(!modalVisible);

                                    getBoard(this.state.boardinput);
                                    // return;
                                    // submitMessage(this.state.message);
                                    // this.setState({message: '', messageHasLength: false});
                                }}
                                onChangeText={(text) => {
                                    if (this.props.onChange) {
                                        this.props.onChange(text);
                                    }
                                    this.state.boardinput = text;
                                }}
                                errorMessage={this.props.error}
                            />
                            <Button
                              title="Close"
                              onPress={() => this.setModalVisible(!modalVisible)}
                            />
                            <View style={{
                                backgroundColor: 'transparent',
                                flex: 1,
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}>
                            { boardsSubscriptionsComponent }

                            </View>
                            <Button
                              title="Edit boards"
                              onPress={() => this.setEditingMode(!editingBoards)}
                            />
                          </View>
                        </View>
                      </Modal>
                    </View>


                    <View style={{
                        backgroundColor: this.props.screenProps.theme.backgroundColour,
                        flex: 1,
                        marginRight: 15,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}>

                        {this.state.messages.length > 0 ? messageComponent : noMessagesComponent}

                    </View>
                </View>
            </View>
        );
    }
}

export const BoardsHomeScreen = withTranslation()(BoardsHomeScreenNoTranslation)

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

//
// export class MessageBubble extends React.Component {
//     constructor(props) {
//         super(props);
//         // this.animation = new Animated.Value(0);
//     }
//
//
//     componentWillMount() {
//       // this.animatedValue = new Animated.Value(0);
//     }
//
//     componentDidMount() {
//
//     }
//
//     render() {
//
//     }
// }


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

             this.state.input.current.clear();

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
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderWidth: 0,
                      borderColor: 'transparent',
                      borderRadius: 15,
                      height: 50
                  }}
                >
                <TextInput
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
                    maxLength={Config.integratedAddressLength}
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
