// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import { Input } from 'react-native-elements';

import {
    View, Image, Text, Button, Platform, TextInput
} from 'react-native';

import {
    importWalletFromSeed, BlockchainCacheApi, WalletBackend, WalletError,
    isValidMnemonic, isValidMnemonicWord,
} from 'kryptokrona-wallet-backend-js';

import Config from './Config';

import { Styles } from './Styles';
import { Globals } from './Globals';
import { saveToDatabase } from './Database';
import { BottomButton } from './SharedComponents';
import './i18n.js';
import { withTranslation } from 'react-i18next';

/**
 * Import a wallet from keys/seed
 */
class ImportWalletScreenNoTranslation extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);
    }

    render() {

      const { t } = this.props;

        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginTop: 60,
                    marginLeft: 30,
                    marginRight: 10,
                }}>
                    <Text style={{ fontFamily: "Montserrat-SemiBold", color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 5 }}>
                        {t('whenCreated')}
                    </Text>

                    <Text style={{ fontFamily: "Montserrat-Regular", color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        {t('whenCreatedSubtitle')}
                    </Text>
                </View>

                <View style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                }}>
                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title={t('pickMonth')}
                            onPress={() => this.props.navigation.navigate('PickMonth')}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title={t('pickApproxBlockHeight')}
                            onPress={() => this.props.navigation.navigate('PickBlockHeight')}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title={t('pickExactBlockHeight')}
                            onPress={() => this.props.navigation.navigate('PickExactBlockHeight')}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title={t('idk')}
                            onPress={() => this.props.navigation.navigate('ImportKeysOrSeed', { scanHeight: 0 })}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>
                </View>
            </View>
        );
    }
}
export const ImportWalletScreen = withTranslation()(ImportWalletScreenNoTranslation)


/* Pick between keys and mnemonic seed */
class ImportKeysOrSeedScreenNoTranslation extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);

        this.scanHeight = this.props.navigation.state.params.scanHeight || 0;
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginTop: 60,
                    marginLeft: 30,
                    marginRight: 10,
                }}>
                    <Text style={{ fontFamily: 'Montserrat-SemiBold', color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 60 }}>
                        {t('howToImport')}
                    </Text>
                </View>

                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title={t('mnemonic')}
                            onPress={() => this.props.navigation.navigate('ImportSeed', { scanHeight: this.scanHeight })}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title={t('privateKeys')}
                            onPress={() => this.props.navigation.navigate('ImportKeys', { scanHeight: this.scanHeight })}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>
                </View>
            </View>
        );
    }
}
export const ImportKeysOrSeedScreen = withTranslation()(ImportKeysOrSeedScreenNoTranslation)


/* Pick between keys and mnemonic seed */
class ImportSeedScreenNoTranslation extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);

        this.state = {
            seed: '',
            seedError: '',
            seedIsGood: false,
        }

        this.scanHeight = this.props.navigation.state.params.scanHeight || 0;
    }

    checkErrors() {
        const valid = this.checkSeedIsValid();

        this.setState({
            seedIsGood: valid,
        });
    }

    async checkSeedIsValid() {
        const words = this.state.seed.toLowerCase().split(' ');

        const invalidWords = [];

        let emptyCount = 0;

        for (const word of words) {
            if (word === '' || word === undefined) {
                emptyCount++;
            } else if (!isValidMnemonicWord(word)) {
                invalidWords.push(word);
            }
        }

        if (invalidWords.length !== 0) {
            this.setState({
                seedError: 'The following words are invalid: ' + invalidWords.join(', '),
            });

            return false;
        } else {
            this.setState({
                seedError: '',
            });
        }

        if (words.length !== 25 || emptyCount !== 0) {
            return false;
        }

        const [valid, error] = await isValidMnemonic(words.join(' '), Config);

        if (!valid) {
            this.setState({
                seedError: error,
            });
        } else {
            this.setState({
                seedError: '',
            });
        }

        return valid;
    }

    async importWallet() {
        const [wallet, error] = await WalletBackend.importWalletFromSeed(
            Globals.getDaemon(), this.scanHeight, this.state.seed.toLowerCase(), Config
        );

        if (error) {
            /* TODO: Report to user */
            Globals.logger.addLogMessage('Failed to import wallet: ' + error.toString());
            this.props.navigation.navigate('Login');
        }

        Globals.wallet = wallet;

        saveToDatabase(Globals.wallet);

        this.props.navigation.navigate('Home');
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginTop: 60,
                    marginLeft: 30,
                    marginRight: 10,
                }}>
                    <Text style={{ fontFamily: 'Montserrat-SemiBold', color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 5 }}>
                        {t('enterMnemonic')}
                    </Text>

                    <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 30 }}>
                        {t('enterMnemonicSubtitle')}
                    </Text>
                </View>

                <View style={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginLeft: 20,
                    flex: 1,
                }}>
                    <Input
                        containerStyle={{
                            width: '90%',
                            marginBottom: 30,
                        }}
                        inputContainerStyle={{
                            borderColor: 'lightgrey',
                            borderWidth: 1,
                            borderRadius: 2,
                        }}
                        label={t('mnemonicSeed')}
                        labelStyle={{
                            marginBottom: 5,
                            marginRight: 2,
                            fontFamily: 'Montserrat-Regular',
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 15,
                            marginLeft: 5
                        }}
                        value={this.state.seed}
                        onChangeText={(text) => {
                            this.setState({
                                seed: text,
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.seedError}
                        autoCapitalize={'none'}
                    />
                </View>

                <BottomButton
                    title={t('continue')}
                    onPress={() => this.importWallet()}
                    disabled={!this.state.seedIsGood}
                    {...this.props}
                />
            </View>
        );
    }
}
export const ImportSeedScreen = withTranslation()(ImportSeedScreenNoTranslation)

/* Pick between keys and mnemonic seed */
class ImportKeysScreenNoTranslation extends React.Component {
    static navigationOptions = {
        title: 'Import Keys',
    };

    constructor(props) {
        super(props);

        this.scanHeight = this.props.navigation.state.params.scanHeight || 0;

        this.state = {
            privateSpendKey: '',
            privateViewKey: '',
            continueEnabled: false,
            spendKeyError: '',
            viewKeyError: '',
        }
    }

    checkErrors() {
        const [spendKeyValid, spendKeyError] = this.checkKey(this.state.privateSpendKey);
        const [viewKeyValid, viewKeyError] = this.checkKey(this.state.privateViewKey);

        this.setState({
            continueEnabled: spendKeyValid && viewKeyValid,
            spendKeyError,
            viewKeyError
        });
    }

    checkKey(key) {
        let errorMessage = '';

        if (key === '' || key === undefined || key === null) {
            return [false, errorMessage];
        }

        const regex = new RegExp('^[0-9a-fA-F]{64}$');

        if (key.length !== 64) {
            errorMessage = 'Key is too short/long';
            return [false, errorMessage];
        }

        const isGood = regex.test(key);

        if (!isGood) {
            errorMessage = 'Key is not hex (a-f, 0-9)';
            return [false, errorMessage];
        }

        return [true, ''];
    }

    async importWallet() {
        const [wallet, error] = await WalletBackend.importWalletFromKeys(
            Globals.getDaemon(), this.scanHeight, this.state.privateViewKey,
            this.state.privateSpendKey, Config
        );

        if (error) {
            /* TODO: Report to user */
            Globals.logger.addLogMessage('Failed to import wallet: ' + error.toString());
            this.props.navigation.navigate('Login');
        }

        Globals.wallet = wallet;

        saveToDatabase(Globals.wallet);

        this.props.navigation.navigate('Home');
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
                <View style={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginTop: 60,
                    marginLeft: 30,
                    marginRight: 10,
                }}>
                    <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 5 }}>
                        {t('enterKeys')}
                    </Text>

                    <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        {t('enterKeysSubtitle')}
                    </Text>
                </View>

                <View style={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    marginLeft: 20,
                    flex: 1,
                }}>
                    <Input
                        containerStyle={{
                            width: '90%',
                            marginBottom: 30,
                        }}
                        inputContainerStyle={{
                            borderColor: 'lightgrey',
                            borderWidth: 1,
                            borderRadius: 2,
                        }}
                        maxLength={64}
                        label={'Private spend key'}
                        labelStyle={{
                            marginBottom: 5,
                            marginRight: 2,
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 15,
                            marginLeft: 5
                        }}
                        value={this.state.paymentID}
                        onChangeText={(text) => {
                            this.setState({
                                privateSpendKey: text,
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.spendKeyError}
                    />

                    <Input
                        containerStyle={{
                            width: '90%',
                        }}
                        inputContainerStyle={{
                            borderColor: 'lightgrey',
                            borderWidth: 1,
                            borderRadius: 2,
                        }}
                        maxLength={64}
                        label={'Private view key'}
                        labelStyle={{
                            marginBottom: 5,
                            marginRight: 2,
                        }}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 15,
                            marginLeft: 5
                        }}
                        value={this.state.paymentID}
                        onChangeText={(text) => {
                            this.setState({
                                privateViewKey: text,
                            }, () => this.checkErrors());
                        }}
                        errorMessage={this.state.viewKeyError}
                    />

                </View>

                <BottomButton
                    title={t('continue')}
                    onPress={() => this.importWallet()}
                    disabled={!this.state.continueEnabled}
                    {...this.props}
                />
            </View>
        );
    }
}
export const ImportKeysScreen = withTranslation()(ImportKeysScreenNoTranslation)
