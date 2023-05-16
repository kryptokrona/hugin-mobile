// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import {
    View, Text, Button, Image,
} from 'react-native';

import { WalletBackend } from 'kryptokrona-wallet-backend-js';

import Config from './Config';

import { Styles } from './Styles';
import { Globals } from './Globals';
import { saveToDatabase, savePreferencesToDatabase } from './Database';
import { XKRLogo } from './XKRLogo';
import { updateCoinPrice } from './Currency';
import { navigateWithDisabledBack } from './Utilities';
import { BottomButton, SeedComponent } from './SharedComponents';
import { getBestNode } from './HuginUtilities';
import './i18n.js';
import { withTranslation } from 'react-i18next';

let changeNode = async () => {
                        
    const node = await getBestNode();
                        
    Globals.preferences.node = node.url + ':' + node.port + ':' + node.ssl;
                       
    await savePreferencesToDatabase(Globals.preferences);
                    
    Globals.wallet.swapNode(Globals.getDaemon());
   
}


/**
 * Create or import a wallet
 */
class WalletOptionScreenNoTranslation extends React.Component {
    static navigationOptions = {
        header: null,
    };

    constructor(props) {
        super(props);
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, justifyContent: 'flex-start', backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{justifyContent: 'center', alignItems: 'center', marginTop: 50}}>
                    <XKRLogo />
                    <Text style={{
                        fontSize: 28,
                        fontFamily: "Montserrat-Bold",
                        color: this.props.screenProps.theme.primaryColour,
                        textAlign: 'center'
                    }}>
                        Hugin Messenger {'\n'}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        fontFamily: "Montserrat-Italic",
                        color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                        textAlign: 'center'
                    }}>
                         {t('welcomeMessage')}
                    </Text>
                </View>

                <View style={[Styles.buttonContainer, {fontFamily: "Montserrat-Regular", bottom: 160, position: 'absolute', alignItems: 'stretch', justifyContent: 'center', width: '100%'}]}>
                    <Button
                        title={t('createNewAccount')}
                        /* Request a pin for the new wallet */
                        onPress={() => this.props.navigation.navigate('Disclaimer', { nextRoute: 'CreateWallet' })}
                        color={this.props.screenProps.theme.buttonColour}
                    />
                </View>

                <View style={[Styles.buttonContainer, {bottom: 100, position: 'absolute', alignItems: 'stretch', justifyContent: 'center', width: '100%'}]}>
                    <Button
                        title={t('restoreAccount')}
                        /* Get the import data */
                        onPress={() => this.props.navigation.navigate('Disclaimer', { nextRoute: 'ImportWallet' })}
                        color={this.props.screenProps.theme.buttonColour}
                    />
                </View>
            </View>
        );
    }
}
export const WalletOptionScreen = withTranslation()(WalletOptionScreenNoTranslation)


/**
 * Create a new wallet
 */
class CreateWalletScreenNoTranslation extends React.Component {
    static navigationOptions = {
        title: 'Create',
        header: null,
    };

    constructor(props) {
        super(props);

        this.state = {
            seed: '',
        }
        };

        async componentDidMount() {

        Globals.wallet = await WalletBackend.createWallet(Globals.getDaemon(), Config);

        const [ seed ] = await Globals.wallet.getMnemonicSeed();

        changeNode();

        this.setState({
            seed,
        });

        /* Save wallet in DB */
        saveToDatabase(Globals.wallet);

    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, justifyContent: 'flex-start', backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 60,
                    marginLeft: 30,
                    marginRight: 10,
                }}>
                    <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 40, fontFamily: "Montserrat-SemiBold", }}>
                        {t('walletCreated')}
                    </Text>

                    <Text style={{ fontFamily: "Montserrat-Regular",fontSize: 15, marginBottom: 20, color: this.props.screenProps.theme.slightlyMoreVisibleColour }}>
                        {t('walletCreatedSubtitle')}
                    </Text>

                    <Text style={{ fontFamily: "Montserrat-SemiBold", color: '#BB4433', marginBottom: 20 }}>
                        {t('walletCreatedSubtitleSubtitle')}
                    </Text>
                </View>

                <View>



                </View>

                <View style={{ alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
                    {this.state.seed !== '' && <SeedComponent
                        seed={this.state.seed}
                        borderColour={'#BB4433'}
                        {...this.props}
                    /> }

                    <BottomButton
                        title="Continue"
                        onPress={() => this.props.navigation.navigate('Home')}
                        {...this.props}
                    />
                </View>

            </View>
        );
    }
}
export const CreateWalletScreen = withTranslation()(CreateWalletScreenNoTranslation)
