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

/**
 * Import a wallet from keys/seed
 */
export class ImportWalletScreen extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);
    }

    render() {
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
                        When did you create your wallet?
                    </Text>

                    <Text style={{ fontFamily: "Montserrat-Regular", color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        This helps us scan your wallet faster.
                    </Text>
                </View>

                <View style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                }}>
                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title="Pick a month"
                            onPress={() => this.props.navigation.navigate('PickMonth')}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title="Pick an approximate block height"
                            onPress={() => this.props.navigation.navigate('PickBlockHeight')}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title="Pick an exact block height"
                            onPress={() => this.props.navigation.navigate('PickExactBlockHeight')}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title="I don't Know"
                            onPress={() => this.props.navigation.navigate('ImportKeysOrSeed', { scanHeight: 0 })}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>
                </View>
            </View>
        );
    }
}

/* Pick between keys and mnemonic seed */
export class ImportKeysOrSeedScreen extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);

        this.scanHeight = this.props.navigation.state.params.scanHeight || 0;
    }

    render() {
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
                        How would you like to import your wallet?
                    </Text>
                </View>

                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title="25 Word Mnemonic Seed"
                            onPress={() => this.props.navigation.navigate('ImportSeed', { scanHeight: this.scanHeight })}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>

                    <View style={[Styles.buttonContainer, {alignItems: 'stretch', width: '100%', marginTop: 5, marginBottom: 5}]}>
                        <Button
                            title="Private Spend + Private View Key"
                            onPress={() => this.props.navigation.navigate('ImportKeys', { scanHeight: this.scanHeight })}
                            color={this.props.screenProps.theme.buttonColour}
                        />
                    </View>
                </View>
            </View>
        );
    }
}

/* Pick between keys and mnemonic seed */
export class ImportSeedScreen extends React.Component {
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
                        Enter your mnemonic seed...
                    </Text>

                    <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 30 }}>
                        This should be 25 english words.
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
                        label={'Mnemonic seed'}
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
                    title='Continue'
                    onPress={() => this.importWallet()}
                    disabled={!this.state.seedIsGood}
                    {...this.props}
                />
            </View>
        );
    }
}

/* Pick between keys and mnemonic seed */
export class ImportKeysScreen extends React.Component {
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
                        Enter your private spend and view key...
                    </Text>

                    <Text style={{ color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        These are both 64 character, hexadecimal strings.
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
                    title="Continue"
                    onPress={() => this.importWallet()}
                    disabled={!this.state.continueEnabled}
                    {...this.props}
                />
            </View>
        );
    }
}
