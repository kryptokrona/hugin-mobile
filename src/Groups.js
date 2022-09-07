// Copyright (C) 2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';
import { checkText } from 'smile2emoji';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import {
    Keyboard, KeyboardAvoidingView, View, Text, TextInput, ScrollView, FlatList, Platform, TouchableWithoutFeedback, Image
} from 'react-native';

import { StackActions } from 'react-navigation';

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


import {intToRGB, hashCode, get_avatar, sendGroupsMessage, createGroup} from './HuginUtilities';

import {toastPopUp} from './Utilities';

import { loadGroupsDataFromDatabase, subscribeToGroup, markGroupConversationAsRead, getGroupMessages} from './Database';

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

export class GroupsScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            groups: Globals.groups,
            index: 0,
        }

        console.log(Globals.groups);

        Globals.updateGroupsFunctions.push(() => {
            this.setState(prevState => ({
                groups: Globals.groups,
                index: prevState.index + 1,
            }))
        });
    }

    render() {
        const { t } = this.props;
        const groups = this.state.groups;
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
                                subtitle={item.lastMessage ? <Text><Text style={{fontFamily: 'Montserrat-SemiBold'}}>{item.lastMessageNickname ? item.lastMessageNickname : t('Anonymous')}</Text><Text style={{fontFamily: 'Montserrat-Regular'}}>{" " + item.lastMessage}{"\n"}</Text><Moment locale={Globals.language} style={{fontFamily: "Montserrat-Regular", fontSize: 10, textAlignVertical: 'bottom' }} element={Text} unix fromNow>{item.lastMessageTimestamp/1000}</Moment></Text> : t('noMessages')}
                                subtitleStyle={{
                                    fontFamily: "Montserrat-Regular"
                                }}
                                chevron={item.read == '1' ? false : newMessageIndicator }
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
                                    console.log('gdbye');
                                    this.props.navigation.navigate(
                                        'GroupChatScreen', {
                                            group: item,
                                        }
                                    );
                                    await markGroupConversationAsRead(item.key);
                                    Globals.groups = await loadGroupsDataFromDatabase();
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
                            // console.log(newGroup);
                            // subscribeToGroup('test', newGroup);
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
                                {'Groups'}
                            </Text>

                            <View style={{
                                height: 37,
                                width: 37,
                                justifyContent: 'center',
                            }}>
                                <SimpleLineIcons
                                    name={'plus'}
                                    size={24}
                                    color={this.props.screenProps.theme.primaryColour}
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

                        {this.state.groups.length > 0 ? groupsComponent : noGroupsComponent}

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
    console.log(group);
    console.log(Globals.groups.some((groups) => groups.group === group));

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
                                          newGroupName: text,
                                          ...shared,
                                      });
                                  } else {
                                      this.setState(shared);
                                  }

                                    //
                                    //
                                    // validGroupName(text);
                                    // const shared = {
                                    //
                                    // };
                                    //
                                    // if (true) {
                                    //     this.setState({
                                    //         newGroup: text,
                                    //         ...shared,
                                    //     });
                                    // } else {
                                    //     this.setState(shared);
                                    // }
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
                                Globals.removeGroup(this.state.key, false);

                                Globals.addGroup({
                                    group: this.state.newGroup,
                                    key: this.state.key
                                });
                                this.setState({
                                    groups: Globals.groups
                                });
                                this.props.navigation.goBack();
                            }}
                            color={this.props.screenProps.theme.primaryColour}
                            disabled={!this.state.groupValid}
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


export class GroupChatScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        const { group, key } = this.props.navigation.state.params.group;
        console.log(group, key);

        this.state = {
            group,
            key,

            initialGroupName: group,

            modifyGroupName: false,

            newGroupName: group,

            groupNameError: '',

            input: React.createRef(),

            groupNameValid: true,

            messages: [],
            message: "",
            messageHasLength: false
        }


        Globals.updateGroupsFunctions.push(() => {
            this.setState({
                messages: Globals.groupMessages
            })
        });

    }

    async componentDidMount() {



        let messages = await getGroupMessages(this.state.key);

        if (!messages) {
          messages = [];
        }

        console.log('Le messages', messages);

        this.setState({
          messages: messages
        });

        Globals.activeChat = this.state.key;

    }

    async componentWillUnmount() {

        Globals.activeChat = '';

    }

    render() {

       markGroupConversationAsRead(this.state.key);

       const { t } = this.props;

       const items = [];

       for (message in this.state.messages) {
         console.log(this.state.messages[message]);
         if (this.state.key == this.state.messages[message].group){
           console.log('okgo');
           let timestamp = this.state.messages[message].timestamp / 1000;
           // if (this.state.messages[message].type == 'received'){
              items.push(<View  key={message} style={{alignSelf: (this.state.messages[message].type == 'received' ? 'flex-start' : 'flex-end'), marginLeft: 20, marginRight: 20, marginBottom: 20, backgroundColor: (this.state.messages[message].type == 'received' ? '#2C2C2C' : '#006BA7'), padding: 15, borderRadius: 15}}><View style={{flexDirection:"row", marginBottom: 10}}><Image
                style={{width: 30, height: 30, marginTop: -5}}
                source={{uri: get_avatar(this.state.messages[message].address)}}
              /><View style={{width: 150, overflow: 'hidden'}}>
                <Text numberOfLines={1} ellipsizeMode={'tail'} style={{
                    color: '#ffffff',
                    fontSize: 15,
                    fontFamily: "Montserrat-SemiBold"
                }}>{this.state.messages[message].nickname ? this.state.messages[message].nickname : t('Anonymous')}
                </Text>
                </View></View><Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{this.state.messages[message].message}</Text><Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment></View>)
           // } else {
           //   items.push(<View  key={message} style={{alignSelf: 'flex-end', marginLeft: 20, marginRight: 20, marginBottom: 20, backgroundColor: '#006BA7', padding: 15, borderRadius: 15}}><Text selectable style={{ fontFamily: "Montserrat-Regular", fontSize: 15 }} >{this.state.messages[message].message}</Text><Moment locale={Globals.language} style={{ fontFamily: "Montserrat-Regular", fontSize: 10, marginTop: 5 }} element={Text} unix fromNow>{timestamp}</Moment></View>)
           // }

       }
       }


           const submitMessage = async (text) => {

             Keyboard.dismiss();

             let updated_messages = await getGroupMessages(this.state.key);
             console.log(updated_messages);
             if (!updated_messages) {
               updated_messages = [];
             }
             let temp_timestamp = Date.now();
             updated_messages.push({
                 address: Globals.wallet.getPrimaryAddress(),
                 nickname: Globals.preferences.nickname,
                 group: this.state.key,
                 type: 'sent',
                 message: checkText(text),
                 timestamp: temp_timestamp,
                 read: 1
             });

             this.setState({
               messages: updated_messages,
               messageHasLength: false
             });

             this.setState({messageHasLength: this.state.message.length > 0});

             let success = await sendGroupsMessage(checkText(text), this.state.key);


             // saveGroupMessage({})

             // await removeGroupMessage(temp_timestamp);
             console.log('wut', success);
             if (success.success == true) {

             this.state.input.current.clear();

             } else {

               console.log('faaaail', success);

               toastPopUp('Message failed to send..');

               this.state.input = text;

               let updated_messages = await getGroupMessages(this.state.key);
                 this.setState({
                   messages: updated_messages,
                   messageHasLength: false
                 })

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
                          source={{uri: get_avatar(this.state.key)}}
                        />
                        <Text onPress={() => {
                          console.log(this.props.navigation.state.params.group);
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
