// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';

import TextTicker from 'react-native-text-ticker';

import { Header } from 'react-native-elements';
import { View, Text, FlatList, Button, Linking, ScrollView, Image } from 'react-native';

import { prettyPrintAmount } from 'kryptokrona-wallet-backend-js';
import { get_avatar, getBoardColors } from './HuginUtilities';
import Config from './Config';
import ListItem from './ListItem';
import List from './ListContainer';
import Constants from './Constants';

import { Styles } from './Styles';
import { Globals } from './Globals';
import { coinsToFiat } from './Currency';
import { prettyPrintUnixTimestamp, prettyPrintDate2 } from './Utilities';
import { getBoardsMessage, boardsMessageExists } from './Database'
import './i18n';
import { withTranslation } from 'react-i18next';
import { Card, TextField, ScreenLayout, ScreenHeader } from './components';

class ItemDescription extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fontSize: this.props.fontSize || 20,
    }
  }

  render() {
    return (
      <View>
        <Text style={{
          color: this.props.screenProps.theme.slightlyMoreVisibleColour,
          fontSize: 15,
          marginTop: 10
        }}>
          {this.props.title}
        </Text>
        <TextTicker
          style={{ color: this.props.screenProps.theme.primaryColour, fontSize: this.state.fontSize, marginBottom: 10 }}
          marqueeDelay={1000}
          duration={220 * this.props.item.length}
        >
          {this.props.item}
        </TextTicker>
      </View>
    )
  }
}

class TransactionDetailsScreenNoTranslation extends React.Component {
  static navigationOptions = {
    title: 'Transaction Details',
  };

  constructor(props) {
    super(props);

    const tx = props.navigation.state.params.transaction;

    const txDetails = Globals.transactionDetails.find((x) => x.hash === tx.hash);

    if (txDetails && txDetails.memo === '') {
      txDetails.memo = undefined;
    }

    this.state = {
      transaction: tx,
      amount: Math.abs(tx.totalAmount()) - (tx.totalAmount() > 0 ? 0 : tx.fee),
      complete: tx.timestamp !== 0,
      coinValue: '0',
      address: txDetails ? txDetails.address : undefined,
      payee: txDetails && txDetails.payee != '' ? txDetails.payee : undefined,
      memo: txDetails ? txDetails.memo : undefined,
      tipTo: null
    };

    (async () => {

      const isTip = await boardsMessageExists(this.state.transaction.paymentID);
      console.log(isTip);
      if (isTip) {
        const tipTo = await getBoardsMessage(this.state.transaction.paymentID);
        console.log(tipTo);
        this.setState({
          tipTo: tipTo
        })
      }

      const coinValue = await coinsToFiat(
        this.state.amount,
        Globals.preferences.currency,
      );

      this.setState({
        coinValue,
      });
    })();
  }

  render() {
    const { t } = this.props;
    const tipTo = this.state.tipTo;
    return (
      <View style={{
        flex: 1,
        backgroundColor: this.props.screenProps.theme.backgroundColour,
      }}>
        <View style={{
          flex: 1,
          alignItems: 'flex-start',
          marginTop: 60,
          backgroundColor: this.props.screenProps.theme.backgroundColour
        }}>
          <ScrollView
            style={{
              flex: 1,
            }}
            contentContainerStyle={{
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              marginHorizontal: 15,
              paddingBottom: 60,
            }}
          >
            <ItemDescription
              title={this.state.transaction.totalAmount() > 0 ? t('received') : t('sent')}
              item={this.state.complete ? prettyPrintUnixTimestamp(this.state.transaction.timestamp) : prettyPrintDate2(Date.now() / 1000)}
              {...this.props}
            />

            {this.state.payee && <ItemDescription
              title={t('recipient')}
              item={this.state.payee}
              {...this.props}
            />}

            <ItemDescription
              title={t('amount')}
              item={prettyPrintAmount(this.state.amount, Config)}
              {...this.props}
            />

            {this.state.transaction.totalAmount() < 0 && <ItemDescription
              title={t('fee')}
              item={prettyPrintAmount(this.state.transaction.fee, Config)}
              {...this.props}
            />}

            <ItemDescription
              title={t('value')}
              item={this.state.coinValue}
              {...this.props}
            />

            {this.state.memo && this.state.memo !== '' && <ItemDescription
              title={t('notes')}
              item={this.state.memo}
              {...this.props}
            />}

            {this.state.address && <ItemDescription
              title={t('address')}
              item={this.state.address}
              {...this.props}
            />}

            <ItemDescription
              title={t('state')}
              item={this.state.complete ? t('completed') : t('processed')}
              {...this.props}
            />

            {this.state.complete && <ItemDescription
              title={t('blockHeight')}
              item={this.state.transaction.blockHeight.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              {...this.props}
            />}

            <ItemDescription
              title={t('hash')}
              item={this.state.transaction.hash}
              {...this.props}
            />

            {this.state.transaction.paymentID !== '' && <ItemDescription
              title={t('paymentID')}
              item={this.state.transaction.paymentID}
              {...this.props}
            />}

            {tipTo && this.state.transaction.paymentID !== '' &&
              <>
                <View style={{ width: '90%', margin: 10 }}>
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 14,
                    fontFamily: "Montserrat-SemiBold"
                  }}>{'This payment was sent as a tip for the post below:'}
                  </Text>
                </View>
                <View style={{
                  margin: 0,
                  backgroundColor: '#272527',
                  borderRadius: 20,
                  padding: 25,
                  alignItems: "center",
                  shadowColor: "#000",
                  width: '90%',
                  shadowOffset: {
                    width: 0,
                    height: 2
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5
                }}>
                  <View style={{
                    margin: 0
                  }}>

                    <View style={{ flexDirection: "row", marginBottom: 10 }}>

                      <Image
                        style={{ width: 50, height: 50, marginTop: -10 }}
                        source={{ uri: get_avatar(tipTo[0].address) }}
                      />
                      <View style={{ width: 150, overflow: 'hidden' }}>
                        <Text numberOfLines={1} ellipsizeMode={'tail'} style={{
                          color: '#ffffff',
                          fontSize: 18,
                          fontFamily: "Montserrat-SemiBold"
                        }}>{tipTo[0].nickname ? tipTo[0].nickname : 'Anonymous'}
                        </Text>
                      </View>

                      <View>
                        <View style={{
                          backgroundColor: getBoardColors(tipTo[0].board)[0],
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

                            {tipTo[0].board}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ paddingLeft: 20, paddingRight: 20 }}>
                      <Text selectable>{tipTo[0].message + "\n"}</Text>
                    </View>
                  </View>
                </View></>
            }
          </ScrollView>
          {this.state.complete && <View style={[Styles.buttonContainer, { width: '100%', marginBottom: 20 }]}>
            <Button
              title={t('viewOnExplorer')}
              onPress={() => {
                Linking.openURL(Config.explorerBaseURL + this.state.transaction.hash)
                  .catch((err) => Globals.logger.addLogMessage('Failed to open url: ' + err));
              }}
              color={this.props.screenProps.theme.buttonColour}
            />
          </View>}
        </View>
      </View>
    );
  }
}

export const TransactionDetailsScreen = withTranslation()(TransactionDetailsScreenNoTranslation)

/**
 * List of transactions sent + received
 */
class TransactionsScreenNoTranslation extends React.Component {
  static navigationOptions = {
    title: 'Transactions',
    header: null
  };

  constructor(props) {
    super(props);

    const [walletHeight, localHeight, networkHeight] = Globals.wallet.getSyncStatus();

    /* Don't display fusions, and display newest first */


    this.state = {
      walletHeight,
      networkHeight,
      pageNum: 0,
      numTransactions: 0
    };

    /* Only update transactions list when transaction is sent/received.
       With lots of transactions, it can be very inefficient to constantly
       refetch. */
    Globals.wallet.on('transaction', () => {
      this.updateTransactions();
    });

    /* When we create a transaction, it is in pending state, which we
       want to display. The on('transaction') will be triggered when it
       gets scanned by the wallet, updating it to confirmed. */
    Globals.wallet.on('createdtx', () => {
      this.updateTransactions();
    });

    this.changePage = this.changePage.bind(this);
  }

  async componentDidMount() {

    const all_transactions = await Globals.wallet.getTransactions();

    const filtered_transactions = all_transactions.filter(tx => {
      return tx.totalAmount() > 1 || tx.totalAmount() < -10000;
    });
    const transactions = filtered_transactions.slice(0, Constants.numTransactionsPerPage);
    const numTransactions = filtered_transactions.length; //await Globals.wallet.getNumTransactions();

    this.setState({
      numTransactions,
      transactions,
    });

    this.interval = setInterval(() => this.tick(), 10000);
  }

  async updateTransactions() {


    const all_transactions = await Globals.wallet.getTransactions();

    let transactions_filtered = all_transactions.filter(tx => {
      return tx.totalAmount() > 1 || tx.totalAmount() < -10000;
    })

    const transactions = transactions_filtered.slice(this.state.pageNum * Constants.numTransactionsPerPage, Constants.numTransactionsPerPage + (this.state.pageNum * Constants.numTransactionsPerPage));

    this.setState({
      numTransactions: transactions_filtered.length,
      transactions,
    });
  }

  async tick() {
    const numTransactions = await Globals.wallet.getNumTransactions();

    /* If we have no transactions, update the heights, to display the
       not sent / not synced msg */
    if (numTransactions === 0) {
      const [walletHeight, localHeight, networkHeight] = Globals.wallet.getSyncStatus();

      this.setState({
        walletHeight,
        networkHeight,
      });
    }
  }


  componentWillUnmount() {
    clearInterval(this.interval);
  }

  changePage(pageNum) {
    if (pageNum < 0 || pageNum >= Math.ceil(this.state.numTransactions / Constants.numTransactionsPerPage) + 1) {
      return
    }

    this.setState({
      pageNum,
    }, this.updateTransactions);
  }

  render() {
    const { t } = this.props;
    const syncedMsg = this.state.walletHeight + 10 >= this.state.networkHeight ?
      ''
      : t('notSyncedMessage');

    return (
      <ScreenLayout>
        <ScreenHeader>
          {t('transactionHistory')}
        </ScreenHeader>
        {this.state.numTransactions === 0 && (
          <Card centered>
            <TextField>
              {t('noTxMessage')}
            </TextField>
            <TextField>
              {syncedMsg}
            </TextField>
          </Card>
        )}

        {this.state.numTransactions > 0 && (
          <TransactionList
            {...this.props}
            pageNum={this.state.pageNum}
            numTransactions={this.state.numTransactions}
            transactions={this.state.transactions}
            changePage={this.changePage}
          />
        )}
      </ScreenLayout>
    );
  }
}


export const TransactionsScreen = withTranslation()(TransactionsScreenNoTranslation)

class TransactionListNoTranslation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: 0,
    }
  }

  getIconName(transaction) {
    if (transaction.totalAmount() >= 0) {
      return 'ios-arrow-dropleft';
    }

    return 'ios-arrow-dropright';
  }

  getIconColour(transaction) {
    if (transaction.totalAmount() >= 0) {
      /* Intentionally using the TurtleCoin green here, instead of the
         theme colour - we want green/red, not to change based on theme */
      return '#40C18E';
    }

    return 'red';
  }

  /* Dumb hack because the flatlist won't re-render when we change the theme
     otherwise */
  componentWillReceiveProps(nextProps) {
    this.setState(prevState => ({
      index: prevState.index + 1,
    }));
  }

  getMaxPage() {
    return Math.ceil(this.props.numTransactions / Constants.numTransactionsPerPage);
  }

  render() {
    const { t } = this.props;
    return (
      <>
        <Header
          containerStyle={{ borderBottomWidth: 0, borderBottomColor: 'transparent' }}
          leftComponent={{
            icon: 'navigate-before',
            color: this.props.pageNum === 0 ? this.props.screenProps.theme.notVeryVisibleColour : this.props.screenProps.theme.primaryColour,
            onPress: () => {
              if (this.props.pageNum <= 0) {
                return;
              }

              this.props.changePage(this.props.pageNum - 1);
            }
          }}
          centerComponent={{
            text: `${t('page')} ${this.props.pageNum + 1} / ${this.getMaxPage()}`,
            style: {
              color: this.props.screenProps.theme.primaryColour,
              fontSize: 16,
              fontFamily: 'Montserrat-SemiBold'
            }
          }}
          rightComponent={{
            icon: 'navigate-next',
            color: this.props.pageNum === this.getMaxPage() - 1 ? this.props.screenProps.theme.notVeryVisibleColour : this.props.screenProps.theme.primaryColour,
            onPress: () => {
              if (this.props.pageNum >= this.getMaxPage() - 1) {
                return;
              }

              this.props.changePage(this.props.pageNum + 1);
            }
          }}
          backgroundColor={this.props.screenProps.theme.backgroundColour} /><List style={{
            backgroundColor: this.props.screenProps.theme.backgroundColour,
            borderTopWidth: 0
          }}>
          <FlatList
            style={{ paddingLeft: 25, paddingRight: 25 }}
            extraData={this.state.index}
            data={this.props.transactions}
            keyExtractor={item => item.hash}
            renderItem={({ item }) => (

              <ListItem
                title={prettyPrintAmount(Math.abs(item.totalAmount()) - (item.totalAmount() > 0 ? 0 : item.fee), Config)}
                subtitle={item.timestamp === 0 ? t('processing') + prettyPrintDate2(Date.now() / 1000) : t('completed') + prettyPrintDate2(item.timestamp)}
                leftIcon={<View style={{ width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name={this.getIconName(item)} size={30} color={this.getIconColour(item)} />
                </View>}
                titleStyle={{
                  color: this.props.screenProps.theme.primaryColour,
                  fontFamily: 'Montserrat-SemiBold'
                }}
                subtitleStyle={{
                  color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                  fontFamily: 'Montserrat-Regular'
                }}
                onPress={() => this.props.navigation.navigate('TransactionDetails', { transaction: item })} />
            )} />
        </List>
      </>
    )
  }
}

export const TransactionList = withTranslation()(TransactionListNoTranslation)
