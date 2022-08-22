// Copyright (C) 2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import { checkText } from 'smile2emoji';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import {
    Linking, Keyboard, KeyboardAvoidingView, View, Text, TextInput, ScrollView, FlatList, Platform, TouchableWithoutFeedback, Image
} from 'react-native';
import Hyperlink from 'react-native-hyperlink'

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


import {intToRGB, hashCode, get_avatar, sendBoardsMessage, getBoardColors} from './HuginUtilities';

import {toastPopUp} from './Utilities';

import { getBoardSubscriptions, subscribeToBoard, markBoardsMessageAsRead, saveToDatabase, getBoardsMessages, getLatestMessages, removeMessage, markConversationAsRead, loadPayeeDataFromDatabase, removeBoard, getBoardRecommendations } from './Database';

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

        let board = this.props.navigation.state.params;
        console.log(board);

        if (board  == undefined) {
          board = 'Home';
        } else {
          board = board.board;
        }
        console.log(board);

        this.state = {
            messages: Globals.boardsMessages,
            index: 0,
            board: board,
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

        const boardsRecommendationsItems = await getBoardRecommendations();

        this.setState({
          messages: this_messages,
          boardssubscriptions: boardsSubscriptions,
          isSubscribedToBoard: true,
          boardsRecommendationsItems: boardsRecommendationsItems
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

        this.input.clear();

        this.setState({messageHasLength: this.state.message.length > 0});

        let success = await sendBoardsMessage(checkText(text), this.state.board, this.state.paymentID);


        // await removeMessage(temp_timestamp);
        if (success.success) {


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
        const boardsRecommendationsItems = this.state.boardsRecommendationsItems;

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
                    {t('noMessages')}
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
                                  subtitle={<Hyperlink linkDefault={ true }><Text selectable style={{fontFamily: "Montserrat-Regular"}}><Text selectable>{item.message + "\n"}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.timestamp}</Moment></Text></Hyperlink>}
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
                                    backgroundColor: getBoardColors(item.board)[0],
                                    borderRadius: 45
                                }}>
                                    <Text style={[Styles.centeredText, {
                                        fontSize: 30,
                                        lineHeight: 40,
                                        fontFamily: 'Montserrat-Black',
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
                                      lineHeight: 38,
                                      color: 'white',
                                      fontFamily: 'Montserrat-Black',
                                    }]}>
                                      X
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

            const storyStyle = {
              borderRadius: 32,
              width: 64,
              height: 64,
              backgroundColor: 'white',
              marginRight: 10
            };

            const storyTextStyle = [Styles.centeredText, {
                fontSize: 30,
                lineHeight: 60,
                width: 64,
                fontFamily: 'Montserrat-Bold',
                color: 'white',
            }];

            const boardsStories =
            <View style={{height:118}}>
                <ScrollView
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                 style={{
                    width: '116%',
                    marginBottom: 20,
                    borderWidth: 0,
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    marginLeft: -20,
                    marginRight: -29
                }}>
                {boardsSubscriptionsItems != undefined && boardsSubscriptionsItems.map(function(item, i){
                  console.log(item.board);
                  return <View><TouchableOpacity onPress={async () => { getBoard(item.board) }} style={[storyStyle, {backgroundColor: getBoardColors(item.board)[0]}]}><Text style={storyTextStyle}>{item.board[0].toUpperCase()}</Text></TouchableOpacity><Text style={{width: 64, textAlign: 'center', fontFamily: 'Montserrat-Regular'}}>{item.board}</Text></View>;
                })
                }
                </ScrollView>
                </View>;

            const boardsRecommendations =
            <View style={{height:118}}>
              <Text style={{fontFamily: 'Montserrat-Regular'}}>Board recommendations:</Text>
                <ScrollView
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                 style={{
                    // width: '116%',
                    marginBottom: 20,
                    borderWidth: 0,
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    // marginLeft: -29
                }}>
                {boardsRecommendationsItems != undefined && boardsRecommendationsItems.map(function(item, i){
                  console.log(item.board);
                  return <View><TouchableOpacity onPress={async () => { getBoard(item.board) }} style={[storyStyle, {backgroundColor: getBoardColors(item.board)[0]}]}><Text style={storyTextStyle}>{item.board[0].toUpperCase()}</Text></TouchableOpacity><Text style={{width: 64, textAlign: 'center', fontFamily: 'Montserrat-Regular'}}>{item.board}</Text></View>;
                })
                }
                </ScrollView>
                </View>;

            const boardsSubscriptionsComponent =
                <ScrollView
                showsVerticalScrollIndicator={false}
                 style={{
                    width: '120%',
                    marginBottom: 20,
                    marginTop: 20,
                    marginLeft: '-10%',
                    borderWidth: 0,
                    borderColor: 'transparent'
                }}>

                    {boardsSubscriptions}

                </ScrollView>;

            const messageInput =
            <View
            style={{
                width: this.state.messageHasLength ? '80%' : '100%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 0,
                  borderColor: 'transparent',
                  borderRadius: 15,
                  height: 70
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
                placeholder={"✏️ " + t('typeMessageHere')}
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
                    width: '85%',
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
                            marginBottom: 15
                        }}>



                            <Text style={{
                                marginLeft: 15,
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 24,
                                fontFamily: "Montserrat-SemiBold"
                            }}>
                                {t('boardsTitle')}
                            </Text>

                            {!this.state.isSubscribedToBoard &&
                              <TouchableWithoutFeedback
                                  onPress={async () => {
                                      if ( isSubscribedTo(board) ) {
                                        return;
                                      }
                                      this.setState({isSubscribedToBoard: true});
                                      subscribeToBoard(board, 0);
                                      const subs = this.state.boardssubscriptions;
                                      subs.push({board: board,key: 0});
                                      this.state.boardssubscriptions = subs;
                                      this.state.boardsRecommendationsItems = await getBoardRecommendations();
                                  }}
                              >
                              <View style={{
                                backgroundColor: this.props.screenProps.theme.buttonColour,
                                padding: 5,
                                paddingTop: 8,
                                borderRadius: 5,
                                height: 28
                              }}>
                              <Text style={{
                                  marginLeft: 5,
                                  marginRight: 5,
                                  color: this.props.screenProps.theme.primaryColour,
                                  fontSize: 16,
                                  fontFamily: "Montserrat-SemiBold",
                                  marginTop: -5
                              }}>
                                  ➕ {t('subscribe')}
                              </Text>
                              </View>
                              </TouchableWithoutFeedback>
                            }

                            <View style={{
                              backgroundColor: getBoardColors(board)[0],
                              padding: 5,
                              paddingTop: 8,
                              borderRadius: 5,
                              height: 28
                            }}>
                            <Text style={{
                                marginLeft: 5,
                                marginRight: 5,
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 16,
                                fontFamily: "Montserrat-SemiBold",
                                marginTop: -5
                            }}>

                                {board}
                            </Text>
                            </View>


                        </View>
                    </TouchableWithoutFeedback>

                    {this.state.board == 'Home' && boardsSubscriptionsItems != undefined && boardsSubscriptionsItems.length > 1 && boardsStories}

                    {this.state.board == 'Home' && boardsSubscriptionsItems != undefined && boardsSubscriptionsItems.length < 2 && boardsRecommendations}

                    <KeyboardAvoidingView
                     behavior={Platform.OS == "ios" ? "padding" : "height"}
                     style={{
                        marginBottom: 10,
                        marginRight: 12,
                        flexDirection: 'row'
                    }}>
                        {this.state.board && this.state.board != 'Home' && messageInput}

                        {this.state.messageHasLength &&

                            <TouchableOpacity
                                onPress={() => {
                                  submitMessage(this.state.message);
                                  this.setState({message: '', messageHasLength: false});
                                }}
                            >
                              <View style={{
                                backgroundColor: '#63D880',
                                padding: 5,
                                paddingTop: 8,
                                borderRadius: 5,
                                height: 28,
                                marginTop: 20,
                                marginLeft: 10
                              }}>
                              <Text style={{
                                  marginLeft: 5,
                                  marginRight: 5,
                                  color: this.props.screenProps.theme.primaryColour,
                                  fontSize: 16,
                                  fontFamily: "Montserrat-SemiBold",
                                  marginTop: -5
                              }}>
                            {t('send')}
                            </Text>
                            </View>
                            </TouchableOpacity>

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
                          backgroundColor: this.props.screenProps.theme.backgroundColour,
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
                        {boardsRecommendationsItems != undefined && boardsRecommendations}
                          <View>
                            <Text style={{
                                marginLeft: 35,
                                color: '#ffffff',
                                fontSize: 24,
                                fontFamily: "Montserrat-SemiBold"
                            }}>{t('myBoards')}
                            </Text>

                            <View
                            style={{
                                // width: this.state.messageHasLength ? '80%' : '100%',
                                  width: 175,
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  borderWidth: 0,
                                  borderColor: 'transparent',
                                  borderRadius: 15,
                                  height: 50,
                                  margin: 15,
                                  padding: 7
                              }}
                            >
                            <TextInput
                                multiline={false}
                                textAlignVertical={'bottom'}
                                ref={boardinput => { this.boardinput = boardinput }}
                                style={{
                                    color: this.props.screenProps.theme.primaryColour,
                                    fontFamily: 'Montserrat-Regular',
                                    fontSize: 15,
                                    paddingTop: 2,
                                    paddingBottom: 6

                                }}
                                maxLength={20}
                                placeholder={  "➕ " + t('subscribe')}
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
                            </View>
                            <Button
                              title={t('close')}
                              onPress={() => this.setModalVisible(!modalVisible)}
                            />
                            <View style={{
                                backgroundColor: 'transparent',
                                height: 200,
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}>
                            { boardsSubscriptionsComponent }

                            </View>
                            <Button
                              title={t('edit')}
                              onPress={() => this.setEditingMode(!editingBoards)}
                            />
                          </View>
                        </View>
                      </Modal>
                    </View>


                    <View style={{
                        backgroundColor: this.props.screenProps.theme.backgroundColour,
                        flex: 1,
                        marginRight: 5,
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
