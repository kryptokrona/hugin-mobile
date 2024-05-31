// Copyright (C) 2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import { checkText } from 'smile2emoji';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
const runes = require('runes');

import {
    Linking, ActivityIndicator, Keyboard, KeyboardAvoidingView, View, Text, TextInput, ScrollView, FlatList, Platform, TouchableOpacity, TouchableWithoutFeedback, Image
} from 'react-native';

import { StackActions } from 'react-navigation';

import {
    validateAddresses, WalletErrorCode, validatePaymentID,
} from 'kryptokrona-wallet-backend-js';

import { Button as RNEButton, Alert, Modal } from 'react-native';

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

import CustomIcon from './CustomIcon.js'

import { Globals } from './Globals';
import { Hr, BottomButton, CopyButton } from './SharedComponents';


import {intToRGB, hashCode, get_avatar, sendGroupsMessage, createGroup, getBoardColors} from './HuginUtilities';

import {toastPopUp} from './Utilities';

import { getGroupsMessage, loadGroupsDataFromDatabase, subscribeToGroup, markGroupConversationAsRead, getGroupMessages, getReplies, saveGroupMessage, removeGroupMessage, blockUser} from './Database';

import './i18n.js';
import { withTranslation } from 'react-i18next';

import {AutoGrowingTextInput} from 'react-native-autogrow-textinput';

import InvertibleScrollView from 'react-native-invertible-scroll-view';

import GestureRecognizer from 'react-native-swipe-gestures';

import Hyperlink from 'react-native-hyperlink'

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

export class GroupsScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            groups: Globals.groups,
            index: 0,
        }

        Globals.updateGroupsFunctions.push(() => {
            this.setState(prevState => ({
                groups: Globals.groups,
                index: prevState.index + 1,
            }))
        });
    }

    render() {
        const { t } = this.props;
        let groups = this.state.groups;
        let uniqueGroups = [];
        groups.forEach((element) => {
            if (!uniqueGroups.includes(element)) {
                uniqueGroups.push(element);
            }
        });
        let standardGroups = Globals.standardGroups;

        console.log(standardGroups);

        standardGroups = standardGroups.filter(a => !this.state.groups.map(b=>b.key).includes(a.key));


        const storyStyle = {
            borderRadius: 25,
            width: 60,
            height: 60,
            backgroundColor: 'white',
            marginRight: 10,
            flexDirection:'row'
          };

          const storyTextStyle = [Styles.centeredText, {
              fontSize: 30,
              lineHeight: 58,
              width: 60,
              fontFamily: 'Montserrat-Bold',
              color: 'white',
              flex: 1,
              flexWrap: 'wrap'
          }];

          const addGroup = (g) => {
            const group = {
                group: g.name,
                key: g.key
            };

            /* Add payee to global payee store */
            Globals.addGroup(group);

              this.props.navigation.dispatch(StackActions.popToTop());
              this.props.navigation.navigate(
                  'GroupChatScreen', {
                      group: group,
                  });


    
          }

        const boardsRecommendations =
        <View style={{height:142}}>
          <Text style={{fontFamily: 'Montserrat-Regular', marginBottom: 5}}>{t('groupsRecommendations')}</Text>
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
            {standardGroups != undefined && standardGroups.map(function(item, i){
              return <View><TouchableOpacity onPress={async () => { addGroup(item) }} style={[storyStyle, {backgroundColor: getBoardColors(item.key)}]}><Text style={storyTextStyle}>{runes(item.name)[0].toUpperCase()}</Text></TouchableOpacity><Text style={{width: 64, textAlign: 'center', fontFamily: 'Montserrat-Regular'}}>{item.name}</Text></View>;
            })
            }
            </ScrollView>
            </View>;
            
        const noGroupsComponent =
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

        const groupsComponent =
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
                        data={groups}
                        keyExtractor={item => item.key}
                        renderItem={({item}) => (
                            <ListItem
                                title={item.group}
                                subtitle={item.lastMessage ? <View><Text style={{fontFamily: 'Montserrat-SemiBold'}}>{item.lastMessageNickname ? item.lastMessageNickname : t('Anonymous')}</Text><Text ellipsizeMode='tail' numberOfLines={1} style={{fontFamily: 'Montserrat-Regular'}}>{item.lastMessage}{"\n"}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.lastMessageTimestamp/1000}</Moment></View> : t('noMessages')}
                                chevron={item.read == '1' ? false : <View style={[unread_counter_style, {borderColor: "#171717", marginTop: 1, marginRight: 5}]}><Text style={unread_counter_text_style}>{item.unreads}</Text></View> }
                                leftIcon={
                                    <Image
                                      style={{width: 50, height: 50}}
                                      source={{uri: get_avatar(item.key)}}
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
                                        'GroupChatScreen', {
                                            group: item,
                                        }
                                    );
                                    // await markGroupConversationAsRead(item.key);
                                    Globals.groups = await loadGroupsDataFromDatabase();
                                    console.log(Globals.groups);
                                    this.setState({
                                        groups: Globals.groups
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
                        onPress={async () => {
                            const newGroup = await createGroup();
                            Globals.fromChat = true;
                            this.props.navigation.navigate('NewGroup', {
                                finishFunction: (item) => {
                                    this.props.navigation.navigate(
                                        'GroupChatScreen', {
                                            group: item,
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
                                {t('groups')}
                            </Text>

                            <View style={{
                                height: 37,
                                width: 37,
                                justifyContent: 'center',
                            }}>
                                <SimpleLineIcons
                                    name={'plus'}
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
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                    }}>

                        {this.state.groups.length > 0 ? groupsComponent : noGroupsComponent}

                        {standardGroups.length ? boardsRecommendations : <></>}

                    </View>
                </View>
            </View>
        );
    }
}

export const GroupsScreen = withTranslation()(GroupsScreenNoTranslation)

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

function validGroupName(group) {
    let errorMessage = '';

    if (Globals.groups.some((groups) => groups.group === group)) {
        errorMessage = `A group with the name ${group} already exists.`;
        return [false, errorMessage];
    }

    if (group === '' || group === undefined || group === null) {
        return [false, errorMessage];
    }

    /* Disable payment ID and wipe input if integrated address */
    // if (address.length === Config.integratedAddressLength) {
    //     await this.setState({
    //         paymentID: '',
    //         paymentIDEnabled: false,
    //     });
    // } else {
    //     this.setState({
    //         paymentIDEnabled: true,
    //     });
    // }
    return [true, errorMessage];
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

class ModifyGroup extends React.Component {
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
                value={this.props.group}
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

export class ModifyGroupScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { group, key } = this.props.navigation.state.params.group;

        this.state = {
            group,
            key,

            initialGroup: group,

            modifyGroup: false,

            newGroup: group,

            groupError: '',

            groupValid: true
        }
    }

    render() {
        const { t } = this.props;
        const group = this.state.group;
        const editableGroup = !Globals.standardGroups.some((rec) => rec.key == this.state.key);
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
                        {this.state.group + t('details')}
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
                          source={{uri: get_avatar(this.state.key)}}
                        />

                        <CopyButton
                            data={this.state.key}
                            name={this.state.key + t('copied')}
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
                                {'Groupname'}
                            </Text>
                            {editableGroup &&
                            <Button
                            title={t('change')}
                            onPress={() => {
                                this.setState({
                                    modifyGroup: !this.state.modifyGroup,
                                });
                            }}
                            titleStyle={{
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 13
                            }}
                            type="clear"
                        />
                            
                            }
                            
                        </View>

                        {!this.state.modifyGroup &&

                        <View>

                          <Text style={{
                              color: this.props.screenProps.theme.primaryColour,
                              fontFamily: 'Montserrat-Regular'
                          }}>
                              {this.state.group}
                          </Text>

                        </View>

                      }

                    </View>

                    <View style={{
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginHorizontal: this.state.modifyGroup ? 20 : 30,
                    }}>
                        {this.state.modifyGroup ?
                            <ModifyGroup
                                address={this.state.group}
                                error={this.state.groupError}
                                onChange={(text) => {

                                  const [valid, error] = validGroupName(text);

                                  const shared = {
                                      group: text,
                                      groupError: error,
                                      groupValid: valid,
                                  };

                                  if (valid) {
                                      this.setState({
                                          newGroup: text,
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
                                                marginTop: 15,
                                                width: '100%',
                                                justifyContent: 'space-between'
                                            }}>
                                                <Text style={{
                                                    color: this.props.screenProps.theme.primaryColour,
                                                    fontFamily: 'Montserrat-SemiBold',
                                                    marginBottom: 5
                                                }}>
                                                    {'Group key'}
                                                </Text>
                                            </View>
                                            <View>

                                              <Text style={{
                                                  color: this.props.screenProps.theme.primaryColour,
                                                  fontFamily: 'Montserrat-Regular'
                                              }}>
                                                  {this.state.key}
                                              </Text>

                                            </View>
                                        </View>

                </View>
                {editableGroup && 
                
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
                            onPress={async () => {
                                await Globals.removeGroup(this.state.key, false);

                                Globals.addGroup({
                                    group: this.state.newGroup,
                                    key: this.state.key
                                });

                                this.setState({
                                    groups: Globals.groups,
                                    group: this.state.newGroup
                                });

                                this.props.navigation.goBack();
                            }}
                            color={this.props.screenProps.theme.primaryColour}
                            disabled={!this.state.groupValid}
                        />
                    </View>
                </View>
              }
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
                                            Globals.removeGroup(this.state.key, true);
                                            this.setState({
                                                groups: Globals.groups
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

export const ModifyGroupScreen = withTranslation()(ModifyGroupScreenNoTranslation)


export class GroupChatScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { group, key } = this.props.navigation.state.params.group;

        this.state = {
            group,
            key,

            initialGroupName: group,

            modifyGroupName: false,

            newGroupName: group,

            groupNameError: '',

            input: React.createRef(),

            groupNameValid: true,

            sending: false,

            messages: [],
            message: "",
            messageHasLength: false,
            messageModalVisible: false,
            activePost: {
                "message": "",
                "address": "",
                "group": "",
                "timestamp": "",
                "nickname": "",
                "reply": "0",
                "hash": "",
                "sent": 0,
                "read": 0
            }
        }

    }

    async componentDidMount() {

        markGroupConversationAsRead(this.state.key);

        let messages = await getGroupMessages(this.state.key, 25);

        Globals.updateGroupsFunctions.push(async () => {
            this.setState({
                messages: await getGroupMessages(this.state.key, Globals.messagesLoaded)
            })
        });

        if (!messages) {
          messages = [];
        }

        this.setState({
          messages: messages
        });

        Globals.messagesLoaded = messages.length;

        Globals.activeGroup = this.state.key;

        this.focusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
                markGroupConversationAsRead(this.state.key);
                Globals.activeGroup = this.state.key;
            }
        );
        this.blurSubscription = this.props.navigation.addListener(
            'willBlur',
            () => {
                Globals.activeGroup = '';
            }
        );

    }

    async componentWillUnmount() {

        Globals.activeGroup = '';
        Globals.updateGroupsFunctions.pop();

    }

    setActivePost = (item) => {
        this.setState({ activePost: item });
      }

    setMessageModalVisible = (visible) => {
        this.setState({ messageModalVisible: visible });
    }

    render() {

       const { t } = this.props;

       const { messageModalVisible, activePost } = this.state;

       const items = [];

       for (message in this.state.messages) {

         if (this.state.key == this.state.messages[message].group){

           let timestamp = this.state.messages[message].timestamp / 1000;
           let thisMessage = this.state.messages[message];

              items.push(
                <TouchableOpacity onPress={async () => {

                    console.log(thisMessage);

                this.state.replies = await getReplies(thisMessage.hash);
                this.setActivePost(thisMessage);

                this.setMessageModalVisible(true);

                }}>
              <View key={message} style={{marginLeft: 20, marginRight: 20, marginBottom: 20, padding: 15, borderRadius: 15}}>
                
                {thisMessage.type == 'processing' && <View style={{position: 'absolute', top: 5, right: 5}}><ActivityIndicator /></View>}
                    {thisMessage.type == 'failed' && <TouchableOpacity style={{marginBottom: 10}} onPress={() => {removeGroupMessage(thisMessage.timestamp); submitMessage(thisMessage.message)}}><Text style={{fontSize: 10}}>Message failed to send. Tap here to try again.</Text></TouchableOpacity>}
                    {thisMessage.replyMessage &&
                    <TouchableOpacity onPress={async () => {

                    this.state.replies = await getReplies(thisMessage.reply);

                    let newActivePost = await getGroupsMessage([thisMessage.reply]);
                    newActivePost = newActivePost[0];

                    this.setActivePost(newActivePost);
    
                    this.setMessageModalVisible(true);
    
                    }}>
                        <View style={{flexDirection:"row", marginBottom: 10}}>
                            <View style={{marginTop: 8, marginRight: 5, width: 10, height: 10, borderTopLeftRadius: 4, borderColor: 'rgba(255,255,255,0.5)', borderLeftWidth: 1, borderTopWidth: 1}}></View>
                            <Text numberOfLines={1} ellipsizeMode={'tail'} >
                            <Text style={{
                                color: '#ffffff',
                                fontSize: 12,
                                fontFamily: "Montserrat-SemiBold"
                            }}>{thisMessage.replyNickname ? thisMessage.replyNickname : t('Anonymous')}</Text>
                            
                            <Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 12, paddingLeft: 5 }} > {thisMessage.replyMessage}</Text>
                            </Text>
                            
                        </View>
                    </TouchableOpacity>
                    }
                    <View style={{flexDirection:"row", marginBottom: 10}}>
                        <Image
                        style={{width: 30, height: 30, marginTop: -5}}
                        source={{uri: get_avatar(thisMessage.address)}}/>
              <View style={{width: 150, overflow: 'hidden'}}>
                <Text numberOfLines={1} ellipsizeMode={'tail'} style={{
                    color: '#ffffff',
                    fontSize: 15,
                    fontFamily: "Montserrat-SemiBold"
                }}>{thisMessage.nickname ? thisMessage.nickname : t('Anonymous')}
                </Text>
                </View></View>
                <Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{thisMessage.message}</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment>
                {thisMessage.replies > 0 &&  <View style={{flexDirection: 'row'}}><CustomIcon name='message' size={14} style={{marginRight: 5, color: 'rgba(255,255,255,0.8)'}} /><Text style={{ fontFamily: "Montserrat-Regular", fontSize: 10}} >{thisMessage.replies}</Text></View> }
                </View>
                </View>
                </TouchableOpacity>

                )
           // } else {
           //   items.push(<View  key={message} style={{alignSelf: 'flex-end', marginLeft: 20, marginRight: 20, marginBottom: 20, backgroundColor: '#006BA7', padding: 15, borderRadius: 15}}><Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{this.state.messages[message].message}</Text><Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment></View>)
           // }

       }
        }

       const modalStyle = {
        height: '100%',
        marginTop: 50,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: this.props.screenProps.theme.backgroundEmphasis,
        borderWidth: 1,
        borderColor: this.props.screenProps.theme.borderColour,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        padding: 25,
        paddingBottom: 100,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
      };

      const replyInput =
            <View
            style={{
                width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 0,
                  borderColor: 'transparent',
                  borderRadius: 15,
                  marginBottom: 15
              }}
            >
            <AutoGrowingTextInput
                multiline={true}
                textAlignVertical={'top'}
                ref={input => { this.replyinput = input }}
                style={{
                    color: this.props.screenProps.theme.primaryColour,
                    fontFamily: 'Montserrat-Regular',
                    fontSize: 15,
                    width: '100%',
                    height: '100%',
                    padding: 15,

                }}
                maxLength={512}
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
                    this.state.reply = text;
                    this.setState({replyHasLength: this.state.reply.length > 0});
                }}
                errorMessage={this.props.error}
            />
            </View>;

            const sendTip = (address, hash, name) => {
                const url = `xkr://?address=${address}&paymentid=${hash}&istip=true&name=${name}`;
                this.setMessageModalVisible(false);
                Linking.openURL(url);
            }

            const submitReply = async (text) => {
                
                Keyboard.dismiss();
                this.setState({reply: '', replyHasLength: false, replying: false});

                submitMessage(text, this.state.activePost.hash);

            }

           const submitMessage = async (text, reply=false) => {

             Keyboard.dismiss();
             this.state.input.current._textInput.clear();

             let temp_timestamp = Date.now();
    
             saveGroupMessage(this.state.key, 'processing', checkText(text), temp_timestamp, Globals.preferences.nickname, Globals.wallet.getPrimaryAddress(), reply ? reply : '', temp_timestamp);

             let updated_messages = await getGroupMessages(this.state.key, this.state.messages.length);
             if (!updated_messages) {
               updated_messages = [];
             }

             this.setState({
               messages: updated_messages,
               messageHasLength: false,
               sending: true
             });

             Globals.messagesLoaded = updated_messages.length;

             this.setState({messageHasLength: this.state.message.trim().length > 0});
             this.scrollView.scrollTo({y: 0, animated: true});
            await sendGroupsMessage(checkText(text), this.state.key, temp_timestamp, reply);
            this.scrollView.scrollTo({y: 0, animated: true});

            if(reply) {
                replies = await getReplies(this.state.activePost.hash);
                this.setState({replies: replies});
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
                        <Image
                          style={{width: 50, height: 50}}
                          source={{uri: get_avatar(this.state.key)}}
                        />
                        <Text onPress={() => {
                            this.props.navigation.navigate(
                                'ModifyGroup', {
                                    group: this.props.navigation.state.params.group,
                                }
                            );
                        }} style={{ fontSize: 18, color: this.props.screenProps.theme.primaryColour, fontFamily: 'Montserrat-SemiBold' }}>
                            {this.state.group}
                        </Text>
                    </View>
                </View>

                <View style={{
                    width: '100%',
                    alignItems: 'center',
                }}>

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

                    {!this.state.sending && this.state.messages?.length > 0 && this.state.messages[0]?.count != this.state.messages?.length && this.state.messages?.length >= 25 &&
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
                    console.log('Loading:' , this.state.messages.length + 25)
                    let updated_messages = await getGroupMessages(this.state.key, this.state.messages.length + 25);
                    Globals.messagesLoaded = updated_messages.length;
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
                      backgroundColor: 'rgba(0,0,0,0.2)',
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
                        this.setState({messageHasLength: this.state.message.trim().length > 0});
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

<GestureRecognizer
                      onSwipeDown={ () => {
                        this.setMessageModalVisible(false);
                        this.setState({replying: false});
                    }}
                    >
                      <View>
                        <Modal
                          style={{}}
                          animationType="slide"
                          transparent={true}
                          visible={messageModalVisible}
                          onRequestClose={() => {
                            this.setMessageModalVisible(!messageModalVisible);
                          }}
                        >
                          <View style={modalStyle}>

                          <View style={{
                                height: 3,
                                width: 30,
                                borderRadius: 3,
                                backgroundColor: 'rgba(255, 255, 255 ,0.3)',
                                alignSelf: 'center',
                                marginTop: -10
                            }} />
                            
                          <TouchableOpacity style={{padding: 15, position: 'absolute', right: 5, top: 5}} onPress={() => {this.setMessageModalVisible(false);this.setState({replying: false});}}>
                            <Text style={{fontSize: 18, fontFamily: "Montserrat-SemiBold", transform: [{ rotate: '45deg'}]}}>+</Text>
                          </TouchableOpacity>
                          <ScrollView style={{width: '100%'}}>


                            <View style={{
                              margin: 10
                            }}>

                            <View style={{flexDirection:"row", marginBottom: 10}}>

                            <Image
                              style={{width: 50, height: 50, marginTop: -10}}
                              source={{uri: get_avatar(this.state.activePost.address)}}
                            />
                            <View style={{width: 150, overflow: 'hidden'}}>
                              <Text numberOfLines={1} ellipsizeMode={'tail'} style={{
                                  color: '#ffffff',
                                  fontSize: 18,
                                  fontFamily: "Montserrat-SemiBold"
                              }}>{this.state.activePost.nickname ? this.state.activePost.nickname : 'Anonymous'}
                              </Text>
                              </View>
                              {/* {board == 'Home' &&
                              <View>
                              <View style={{
                                backgroundColor: getBoardColors(this.state.activePost.board)[0],
                                padding: 2,
                                paddingBottom: 5,
                                paddingTop: 8,
                                borderRadius: 5,
                                height: 20,
                                marginLeft: 'auto'
                              }}>
                              <Text ellipsizeMode={'tail'} numberOfLines={2} style={{
                                  marginLeft: 5,
                                  marginRight: 5,
                                  color: this.props.screenProps.theme.primaryColour,
                                  fontSize: 10,
                                  fontFamily: "Montserrat-Regular",
                                  marginTop: -5
                              }}>

                                  {this.state.activePost.board}
                                </Text>
                              </View>
                              </View>
                             } */}


                              </View>
                              <View style={{paddingLeft: 20, paddingRight: 20}}>


                                <Text style={{fontSize: 16}}selectable>{this.state.activePost.message + "\n"}</Text>
                                <Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{this.state.activePost.timestamp / 1000}</Moment>


                              </View>
                          </View>

                          <KeyboardAvoidingView
                           behavior={Platform.OS == "ios" ? "padding" : "height"}
                           style={{
                              marginBottom: 10,
                              marginRight: 12,
                              flexDirection: 'row'
                          }}>
                          {this.state.replying &&
                            replyInput
                          }

                          </KeyboardAvoidingView>

                          <View style={{width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                    borderWidth: 1,
                                    borderColor: this.props.screenProps.theme.borderColour,
                                    borderRadius: 15,
                                    padding: 10,
                                    flexDirection: 'row',
                                    alignContent: 'center',
                                    justifyContent: 'space-between'
                                  }}
                              onPress={() => sendTip(this.state.activePost.address, this.state.activePost.hash, this.state.activePost.nickname)}
                            >
                                <CustomIcon name='coin' size={18} style={{marginRight: 4, color: 'rgba(255,255,255,0.8)'}} />
                                <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'left',
                        fontSize: 14,
                        fontFamily: 'Montserrat-Bold',
                        textAlign: 'center'
                      }}>
                        Send tip</Text>
                            </TouchableOpacity>
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
                                    marginLeft: 10
                                  }}
                              onPress={() => {this.state.replying && this.state.replyHasLength ? submitReply(this.state.reply) : this.setState({replying: !this.state.replying})}}
                            >
                                <CustomIcon name='direct-send' size={18} style={{marginRight: 4, color: 'rgba(255,255,255,0.8)'}} />
                                <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'left',
                        fontSize: 14,
                        fontFamily: 'Montserrat-Bold',
                        textAlign: 'center'
                      }}>
                        Reply</Text>
                            </TouchableOpacity>
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
                                    marginLeft: 10
                                  }}
                              onPress={() => {
                                blockUser(this.state.activePost.address, this.state.activePost.nickname);
                                this.setMessageModalVisible(false);
                              }}
                            >
                                <CustomIcon name='user-remove' size={18} style={{marginRight: 4, color: 'rgba(255,255,255,0.8)'}} />
                                <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'left',
                        fontSize: 14,
                        fontFamily: 'Montserrat-Bold',
                        textAlign: 'center'
                      }}>
                        Block</Text>
                            </TouchableOpacity>
                          </View>


                        <View style={{marginTop: 10}}>

                        {this.state.replies && this.state.replies.map((item,i) => {
                          return <View style={{borderRadius: 20, margin: 10, paddingBottom: 30}}>
                            {item.type == 'failed' && <TouchableOpacity style={{marginBottom: 10}} onPress={() => {submitReply(item.message)}}><Text style={{fontSize: 10}}>Message failed to send. Tap here to try again.</Text></TouchableOpacity>}
                          <View style={{flexDirection:"row"}}>
                          <Image
                            style={{width: 32, height: 32, marginTop: -5}}
                            source={{uri: get_avatar(item.address)}}
                          />
                          <View style={{width: 150, overflow: 'hidden'}}>
                            <Text numberOfLines={1} ellipsizeMode={'tail'} style={{
                                color: '#ffffff',
                                fontSize: 14,
                                fontFamily: "Montserrat-SemiBold"
                            }}>{item.nickname ? item.nickname : 'Anonymous'}
                            </Text>
                            </View>
                          </View>
                          <Hyperlink linkDefault={ true }><Text selectable style={{fontFamily: "Montserrat-Regular"}}>{item.message}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.timestamp / 1000}</Moment></Hyperlink>
                          </View>
                        } ) }

                        </View>




                        </ScrollView>
                        </View>
                        </Modal>
                      </View>
                    </GestureRecognizer>

            </KeyboardAvoidingView>
            </View>
        );
    }
}

export const GroupChatScreen = withTranslation()(GroupChatScreenNoTranslation)


export class NewGroupScreenNoTranslation extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerRight: (
                <CrossButton navigation={navigation}/>
            ),
        }
    };

    constructor(props) {
        super(props);

        const group = this.props.navigation.getParam('group', '');
        const key = this.props.navigation.getParam('key', '');

        this.state = {
            group: group,
            key: key,
            groupError: '',
            keyError: ''
            // addOrCreate: undefined
        };
    }

    setGroupFromQrCode(address) {
        this.setState({
            group,
            key,
        }, () => this.checkErrors());
    }

    validGroupKey(paymentID) {
        let errorMessage = '';

        if (paymentID === '') {
            return [true, errorMessage];
        }

        if (paymentID === undefined || paymentID === null) {
            return [false, errorMessage];
        }

        if (Globals.groups.some((groups) => groups.key === paymentID)) {
            errorMessage = `A group with the key ${paymentID} already exists.`;
            return [false, errorMessage];
        }

        const paymentIDError = validatePaymentID(paymentID);

        if (paymentIDError.errorCode !== WalletErrorCode.SUCCESS) {
            errorMessage = paymentIDError.toString();

            return [false, errorMessage];
        }

        return [true, errorMessage];
    }


    checkErrors() {
        (async() => {

            const [groupValid, groupError]  = await validGroupName(this.state.group);
            const [keyValid, keyError]  = this.validGroupKey(this.state.key);

            this.setState({
                continueEnabled: groupValid && keyValid,
                groupError,
                keyError
            });

        })();
    }

    render() {
      const { t } = this.props;
      const key = this.state.key;
        return(
            <View style={{
                backgroundColor: this.props.screenProps.theme.backgroundColour,
                flex: 1,
            }}>
                <View style={{
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flex: 1,
                    marginTop: 60,
                }}>


                    <Text style={{ fontFamily: "Montserrat-SemiBold", color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 40, marginLeft: 30 }}>
                        {'Add group'}
                    </Text>

                    {this.state.key != '' &&

                    <Image
                      style={{width: 50, height: 50}}
                      source={{uri: get_avatar(this.state.key)}}
                    />

                    }

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
                        labelStyle={{
                            fontFamily: 'Montserrat-Regular',
                            marginBottom: 5,
                            marginRight: 2,
                            color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 14,
                            marginLeft: 5,
                            fontFamily: 'Montserrat-SemiBold',
                        }}
                        label={t('name')}
                        value={this.state.group}
                        onChangeText={(text) => {
                            this.setState({
                                group: text,
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.groupError}
                    />
                    <View style={{ alignItems: 'center', marginTop: 8, borderRadius: 3, paddingTop: 0,
                                    borderColor: this.props.screenProps.theme.borderColour,
                                    borderWidth: 1,}}>
                      <Button
                          title={'New board'}
                          onPress={async () => {
                              const newKey = await createGroup();
                              this.checkErrors();
                              this.setState({
                                  key: newKey
                              });
                              this.state.key = newKey;
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
                        marginBottom: 30,
                        fontFamily: 'Montserrat-Regular',
                    }}
                    inputContainerStyle={{
                        borderWidth: 0,
                        borderRadius: 15,
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderColor: 'transparent'
                    }}
                    labelStyle={{
                        fontFamily: 'Montserrat-Regular',
                        marginBottom: 5,
                        marginRight: 2,
                        color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                    }}
                    inputStyle={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 14,
                        marginLeft: 5,
                        fontFamily: 'Montserrat-SemiBold',
                    }}
                        maxLength={64}
                        label={t('messageKey')}
                        value={this.state.key}
                        onChangeText={(text) => {
                            this.setState({
                                key: text
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.keyError}
                    />



                    <BottomButton
                        title={t('continue')}
                        onPress={() => {
                            const group = {
                                group: this.state.group,
                                key: this.state.key
                            };

                            /* Add payee to global payee store */
                            Globals.addGroup(group);

                            const finishFunction = Globals.fromChat; // = this.props.navigation.getParam('finishFunction', undefined);

                            if (finishFunction) {
                              Globals.fromChat = false;
                              this.props.navigation.dispatch(StackActions.popToTop());
                              this.props.navigation.navigate(
                                  'GroupChatScreen', {
                                      group: group,
                                  });

                                  return;

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

export const NewGroupScreen = withTranslation()(NewGroupScreenNoTranslation)
