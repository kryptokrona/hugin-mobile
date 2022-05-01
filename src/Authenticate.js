// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import PINCode, { hasUserSetPinCode, deleteUserPinCode } from '@haskkor/react-native-pincode';

import FingerprintScanner from 'react-native-fingerprint-scanner';

import * as Animatable from 'react-native-animatable';

import RNExitApp from 'react-native-exit-app';

import React from 'react';

import { View, Alert, Text, Platform, Image, Switch } from 'react-native';

import { Button } from 'react-native-elements';

import Config from './Config';

import { Styles } from './Styles';
import { Globals } from './Globals';
import { FadeView } from './FadeView';
import { XKRLogo } from './XKRLogo';
import { setHaveWallet, savePreferencesToDatabase } from './Database';
import { BottomButton } from './SharedComponents';
import { navigateWithDisabledBack } from './Utilities';
import './i18n.js';
import { withTranslation } from 'react-i18next';

/* Dummy component that redirects to pin auth or hardware auth as appropriate */
export async function Authenticate(navigation, subtitle, finishFunction, disableBack = false) {
    /* No auth, just go straight to the finish function */
    if (Globals.preferences.authenticationMethod === 'none') {
        finishFunction(navigation);
        return;
    }

    let route = 'RequestPin';

    try {
        const sensorType = await FingerprintScanner.isSensorAvailable();

        /* User wants to use hardware authentication, and we have it available */
        if (Globals.preferences.authenticationMethod === 'hardware-auth') {
            route = 'RequestHardwareAuth';
        }
    } catch (err) {
        // No fingerprint sensor
    }

    if (disableBack) {
        navigation.dispatch(
            navigateWithDisabledBack(route, {
                finishFunction,
                subtitle,
            }),
        );
    } else {
        navigation.navigate(route, {
            finishFunction,
            subtitle,
        });
    }
}

const authErrorToHumanError = new Map([
    ['AuthenticationNotMatch', 'Fingerprint does not match stored fingerprint.'],
    ['AuthenticationFailed', 'Fingerprint does not match stored fingerprint.'],
    ['UserCancel', 'Authentication was cancelled.'],
    ['UserFallback', 'Authentication was cancelled.'],
    ['SystemCancel', 'Authentication was cancelled by the system.'],
    ['PasscodeNotSet', 'No fingerprints have been registered.'],
    ['FingerprintScannerNotAvailable', 'This device does not support fingerprint scanning.'],
    ['FingerprintScannerNotEnrolled', 'No fingerprints have been registered.'],
    ['FingerprintScannerUnknownError', 'Failed to authenticate for an unknown reason.'],
    ['FingerprintScannerNotSupported', 'This device does not support fingerprint scanning.'],
    ['DeviceLocked', 'Authentication failed too many times.'],
]);

export class RequestHardwareAuthScreen extends React.Component {
    constructor(props) {
        super(props);

        this.onAuthAttempt = this.onAuthAttempt.bind(this);
    }

    componentDidMount() {
        this.auth();
    }

    componentWillUnmount() {
        FingerprintScanner.release();
    }

    onAuthAttempt(error) {
        const detailedError = authErrorToHumanError.get(error.name) || error.message;

        const usePinInsteadErrors = [
            'UserCancel',
            'UserFallback',
            'SystemCancel',
            'PasscodeNotSet',
            'FingerprintScannerNotAvailable',
            'FingerprintScannerNotEnrolled',
            'FingerprintScannerUnknownError',
            'FingerprintScannerNotSupported',
            'DeviceLocked',
        ];

        /* Use pin instead of fingerprint scanner if a specific
           type of error is thrown */
        if (usePinInsteadErrors.includes(error.name)) {
            Alert.alert(
                'Failed ' + this.props.navigation.state.params.subtitle,
                `${detailedError} Please use PIN Auth instead.`,
                [
                    {text: 'OK', onPress: () => {
                        this.props.navigation.navigate('RequestPin', {
                            subtitle: this.props.navigation.state.params.subtitle,
                            finishFunction: this.props.navigation.state.params.finishFunction
                        })
                    }},
                ]
            );
        } else {
            Alert.alert(
                'Failed ' + this.props.navigation.state.params.subtitle,
                `Please try again (Error: ${detailedError})`,
                [
                    {text: 'OK', onPress: () => {
                        this.auth();
                    }},
                ]
            );
        }
    }

    async auth() {
        try {
            await FingerprintScanner.authenticate({
                onAttempt: this.onAuthAttempt,
            });

            this.props.navigation.state.params.finishFunction(this.props.navigation);
        } catch(error) {
            this.onAuthAttempt(error);
        };
    }

    render() {
        return(
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: this.props.screenProps.theme.backgroundColour
            }}>
                {Platform.OS === 'android' &&
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <XKRLogo />

                            <Text style={[Styles.centeredText, {
                                fontSize: 22,
                                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                                marginHorizontal: 80,
                                fontFamily: "Montserrat-SemiBold",
                            }]}>
                                Touch the fingerprint sensor {this.props.navigation.state.params.subtitle}
                            </Text>

                            <Animatable.Image
                                source={require('../assets/img/fingerprint.png')}
                                style={{
                                    resizeMode: 'contain',
                                    width: 80,
                                    height: 80,
                                    marginTop: 40,
                                    justifyContent: 'flex-end',
                                }}
                                animation='pulse'
                                easing='ease-out'
                                iterationCount='infinite'
                            />
                        </View>

                        <View style={{ width: '100%', bottom: 20, position: 'absolute' }}>
                            <Button
                                title='Or enter your PIN'
                                onPress={() => {
                                    this.props.navigation.navigate('RequestPin', {
                                        subtitle: this.props.navigation.state.params.subtitle,
                                        finishFunction: this.props.navigation.state.params.finishFunction
                                    })
                                }}
                                titleStyle={{
                                    color: this.props.screenProps.theme.slightlyMoreVisibleColour,
                                    fontSize: 15,
                                    textDecorationLine: 'underline',
                                }}
                                type='clear'
                            />
                        </View>
                    </View>
                }
            </View>
        );
    }
}

class ChooseAuthMethodScreenNoTranslation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hardwareAuth: Globals.preferences.authenticationMethod === 'hardware-auth',
            pinCode: Globals.preferences.authenticationMethod === 'pincode',
            noAuth: Globals.preferences.authenticationMethod === 'none',
        }
    }

    render() {
      const { t } = this.props;
        return(
            <View style={{ flex: 1, backgroundColor: this.props.screenProps.theme.backgroundColour }}>
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
                        {t('authenticateHow')}
                    </Text>

                    <View style={{ flexDirection: 'row', marginRight: 20, marginLeft: 25, marginBottom: 20 }}>
                        <Switch
                            value={this.state.hardwareAuth}
                            onValueChange={(value) => {
                                this.setState({
                                    hardwareAuth: value,
                                    pinCode: value ? false : this.state.pinCode,
                                    noAuth: value ? false : this.state.noAuth,
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
                                {t('useHardware')}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', marginRight: 20, marginLeft: 25, marginBottom: 20 }}>
                        <Switch
                            value={this.state.pinCode}
                            onValueChange={(value) => {
                                this.setState({
                                    hardwareAuth: value ? false : this.state.hardwareAuth,
                                    pinCode: value,
                                    noAuth: value ? false : this.state.noAuth,
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
                                {t('usePinCode')}
                            </Text>
                        </View>

                    </View>

                    <View style={{ flexDirection: 'row', marginRight: 20, marginLeft: 25, marginBottom: 20 }}>
                        <Switch
                            value={this.state.noAuth}
                            onValueChange={(value) => {
                                this.setState({
                                    hardwareAuth: value ? false : this.state.hardwareAuth,
                                    pinCode: value ? false : this.state.pinCode,
                                    noAuth: value
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
                                {t('noAuth')}
                            </Text>
                        </View>

                    </View>

                    <BottomButton
                        title={t('continue')}
                        onPress={() => {
                            (async() => {
                                let method = 'none';

                                if (this.state.hardwareAuth) {
                                    method = 'hardware-auth';
                                } else if (this.state.pinCode) {
                                    method = 'pincode';
                                }

                                Globals.preferences.authenticationMethod = method;

                                savePreferencesToDatabase(Globals.preferences);

                                const havePincode = await hasUserSetPinCode();

                                if (method === 'none' || havePincode) {
                                    this.props.navigation.navigate(this.props.navigation.state.params.nextRoute);
                                } else {
                                    this.props.navigation.navigate('SetPin', {
                                        nextRoute: this.props.navigation.state.params.nextRoute
                                    });
                                }
                            })();
                        }}
                        disabled={!(this.state.noAuth || this.state.pinCode || this.state.hardwareAuth)}
                        {...this.props}
                    />
                </View>
            </View>
        );
    }
}

export const ChooseAuthMethodScreen = withTranslation()(ChooseAuthMethodScreenNoTranslation)

/**
 * Enter a pin for the new wallet
 */
export class SetPinScreen extends React.Component {
    static navigationOptions = {
        title: '',
    }

    constructor(props) {
        super(props);
    }

    continue(pinCode) {
        /* Continue on to create or import a wallet */
        this.props.navigation.navigate(this.props.navigation.state.params.nextRoute);
    }

    render() {
        const subtitle = `to keep your ${Config.coinName} secure`;

        return(
            <View style={{
                flex: 1,
                backgroundColor: this.props.screenProps.theme.backgroundColour
            }}>
                <PINCode
                    status={'choose'}
                    finishProcess={(pinCode) => this.continue(pinCode)}
                    subtitleChoose={subtitle}
                    passwordLength={6}
                    touchIDDisabled={true}
                    colorPassword={this.props.screenProps.theme.primaryColour}
                    stylePinCodeColorSubtitle={this.props.screenProps.theme.primaryColour}
                    stylePinCodeColorTitle={this.props.screenProps.theme.primaryColour}
                    stylePinCodeButtonNumber={this.props.screenProps.theme.pinCodeForegroundColour}
                    numbersButtonOverlayColor={this.props.screenProps.theme.secondaryColour}
                    stylePinCodeDeleteButtonColorShowUnderlay={this.props.screenProps.theme.primaryColour}
                    stylePinCodeDeleteButtonColorHideUnderlay={this.props.screenProps.theme.primaryColour}
                    colorCircleButtons={this.props.screenProps.theme.pinCodeBackgroundColour}
                />
            </View>
        );
    }
}

export class ForgotPinScreen extends React.Component {
    static navigationOptions = {
        title: '',
    }

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <View style={{
                flex: 1,
                backgroundColor: this.props.screenProps.theme.backgroundColour,
            }}>
                <View style={{
                    flex: 1,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 60,
                    backgroundColor: this.props.screenProps.theme.backgroundColour,
                }}>
                    <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                        marginLeft: 30,
                        marginBottom: 20,
                    }}>
                        Your account is encrypted with your pin, so unfortunately, if you have forgotten your pin, it cannot be recovered.
                    </Text>
                    <Text style={{
                        color: this.props.screenProps.theme.primaryColour,
                        fontSize: 25,
                        marginLeft: 30
                    }}>
                        However, you can delete your account if you wish to create a new one.
                    </Text>
                </View>

                <BottomButton
                    title='Delete Account'
                    onPress={() => {
                        (async () => {
                            await setHaveWallet(false);

                            await deleteUserPinCode();

                            this.props.navigation.navigate('Splash');

                            /* Can't use navigateWithDisabledBack between routes, but don't
                               want to be able to go back to previous screen...
                               Navigate to splash, then once on that route, reset the
                               stack. */
                            this.props.navigation.dispatch(navigateWithDisabledBack('Splash'));
                        })();
                    }}
                    buttonStyle={{
                        backgroundColor: 'red',
                        height: 50,
                        borderRadius: 0,
                    }}
                    {...this.props}
                />
            </View>
        );
    }
}

/**
 * Prompt for the stored pin to unlock the wallet
 */
export class RequestPinScreen extends React.Component {
    static navigationOptions = {
        title: '',
    }

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <View
                style={{
                    flex: 1,
                    backgroundColor: this.props.screenProps.theme.backgroundColour
                }}
            >
                <PINCode
                    status={'enter'}
                    finishProcess={() => {
                        this.props.navigation.state.params.finishFunction(this.props.navigation);
                    }}
                    subtitleEnter={this.props.navigation.state.params.subtitle}
                    passwordLength={6}
                    touchIDDisabled={true}
                    colorPassword={this.props.screenProps.theme.primaryColour}
                    stylePinCodeColorSubtitle={this.props.screenProps.theme.primaryColour}
                    stylePinCodeColorTitle={this.props.screenProps.theme.primaryColour}
                    stylePinCodeButtonNumber={this.props.screenProps.theme.pinCodeForegroundColour}
                    numbersButtonOverlayColor={this.props.screenProps.theme.secondaryColour}
                    stylePinCodeDeleteButtonColorShowUnderlay={this.props.screenProps.theme.primaryColour}
                    stylePinCodeDeleteButtonColorHideUnderlay={this.props.screenProps.theme.primaryColour}
                    onClickButtonLockedPage={() => RNExitApp.exitApp()}
                    colorCircleButtons={this.props.screenProps.theme.pinCodeBackgroundColour}
                />

                <Button
                    title='Forgot PIN?'
                    onPress={() => {
                        this.props.navigation.navigate('ForgotPin');
                    }}
                    titleStyle={{
                        color: this.props.screenProps.theme.primaryColour,
                        textDecorationLine: 'underline',
                        marginBottom: 10,
                    }}
                    type='clear'
                />
            </View>
        );
    }
}
