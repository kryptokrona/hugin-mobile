// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import { View, Text, Switch } from 'react-native';

import Config from './Config';

import { BottomButton } from './SharedComponents';

import './i18n.js';
import { withTranslation } from 'react-i18next';

class DisclaimerScreenNoTranslation extends React.Component {
  static navigationOptions = {
    title: '',
  };

  constructor(props) {
    super(props);

    this.state = {
      feeAccepted: Config.devFeePercentage > 0 ? false : true,
      keyOwnershipAccepted: false,
      warrantyAccepted: false,
    }
  }

  confirm() {
    this.props.navigation.navigate('WalletOption');
  }

  render() {
    const { t } = this.props;
    return (
      <View style={{
        backgroundColor: this.props.screenProps.theme.backgroundColour,
        flex: 1,
      }}>
        <View style={{
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          flex: 1,
          marginTop: 60,
          backgroundColor: this.props.screenProps.theme.backgroundColour
        }}>
          <Text style={{
            color: this.props.screenProps.theme.primaryColour,
            fontSize: 25,
            marginBottom: 40,
            marginLeft: 30,
            marginRight: 20,
            fontFamily: "Montserrat-SemiBold",
          }}>
            {t('disclaimer')}
          </Text>

          {Config.devFeePercentage > 0 && <View style={{ flexDirection: 'row', marginRight: 20, marginLeft: 25, marginBottom: 20 }}>
            <Switch
              value={this.state.feeAccepted}
              onValueChange={(value) => {
                this.setState({
                  feeAccepted: value
                });
              }}
              style={{ marginRight: 15 }}
            />

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
              }}>
                I understand that the fee for sending transactions is {Config.devFeePercentage}%.
              </Text>
            </View>
          </View>}

          <View style={{ flexDirection: 'row', marginRight: 20, marginLeft: 25, marginBottom: 20 }}>
            <Switch
              value={this.state.keyOwnershipAccepted}
              onValueChange={(value) => {
                this.setState({
                  keyOwnershipAccepted: value
                });
              }}
              style={{ marginRight: 15 }}
            />

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                fontFamily: "Montserrat-Regular",
              }}>
                {t('privateKeyWarning')}
              </Text>
            </View>

          </View>

          <View style={{ flexDirection: 'row', marginRight: 20, marginLeft: 25, marginBottom: 20 }}>
            <Switch
              value={this.state.warrantyAccepted}
              onValueChange={(value) => {
                this.setState({
                  warrantyAccepted: value
                });
              }}
              style={{ marginRight: 15 }}
            />

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                fontFamily: "Montserrat-Regular",
              }}>
                {t('warrantyWarning')}
              </Text>
            </View>

          </View>

          <BottomButton
            title={t('continue')}
            onPress={() => {
              this.props.navigation.navigate('ChooseAuthMethod', { nextRoute: this.props.navigation.state.params.nextRoute })
            }}
            disabled={!this.state.feeAccepted || !this.state.keyOwnershipAccepted || !this.state.warrantyAccepted}
            {...this.props}
          />
        </View>
      </View>
    );
  }
}

export const DisclaimerScreen = withTranslation()(DisclaimerScreenNoTranslation)
