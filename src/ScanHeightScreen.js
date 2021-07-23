// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import MonthSelectorCalendar from 'react-native-month-selector';

import moment from 'moment';

import { View, Text, Button } from 'react-native';

import { Input } from 'react-native-elements';

import Config from './Config';

import { Styles } from './Styles';
import { BottomButton } from './SharedComponents';
import { getApproximateBlockHeight, dateToScanHeight } from './Utilities';

export class PickMonthScreen extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);

        this.state = {
            month: moment().startOf('month'),
        }
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
                        Which month did you create your wallet?
                    </Text>

                    <Text style={{fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        This helps us scan your wallet faster.
                    </Text>
                </View>

                <View style={{ justifyContent: 'center', alignItems: 'stretch' }}>
                    <MonthSelectorCalendar
                        minDate={moment(Config.chainLaunchTimestamp)}
                        selectedBackgroundColor={this.props.screenProps.theme.primaryColour}
                        monthTextStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                        }}
                        monthDisabledStyle={{
                            color: this.props.screenProps.theme.notVeryVisibleColour,
                        }}
                        currentMonthTextStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                        }}
                        seperatorColor={this.props.screenProps.theme.primaryColour}
                        nextIcon={
                            <Text style={{
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 16,
                                marginRight: 10,
                                fontFamily: 'Montserrat-SemiBold',
                            }}>
                                Next
                            </Text>
                        }
                        prevIcon={
                            <Text style={{
                                color: this.props.screenProps.theme.primaryColour,
                                fontSize: 16,
                                marginLeft: 10,
                                fontFamily: 'Montserrat-SemiBold',
                            }}>
                                Prev
                            </Text>
                        }
                        yearTextStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 18,
                            fontFamily: 'Montserrat-SemiBold',
                        }}
                        selectedDate={this.state.month}
                        onMonthTapped={(date) => this.setState({ month: date})}
                        containerStyle={{
                            backgroundColor: this.props.screenProps.theme.backgroundColour,
                        }}
                    />
                </View>

                <BottomButton
                    title='Continue'
                    onPress={() => this.props.navigation.navigate('ImportKeysOrSeed', { scanHeight: dateToScanHeight(this.state.month) })}
                    {...this.props}
                />

            </View>
        );
    }
}

export class PickExactBlockHeightScreen extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);

        this.state = {
            value: '',
            errorMessage: '',
            valid: false,
        };
    }

    scanHeightIsValid(scanHeightText) {
        if (scanHeightText === '' || scanHeightText === undefined) {
            return [false, ''];
        }

        const scanHeight = Number(scanHeightText);

        if (isNaN(scanHeight)) {
            return [false, 'Scan height is not a number.'];
        }

        if (scanHeight < 0) {
            return [false, 'Scan height is negative.'];
        }

        if (!Number.isInteger(scanHeight)) {
            return [false, 'Scan height is not an integer.'];
        }

        return [true, ''];
    }

    onChangeText(text) {
        const [valid, error] = this.scanHeightIsValid(text);

        this.setState({
            value: text,
            errorMessage: error,
            valid,
        });
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
                        What block did you create your wallet at?
                    </Text>

                    <Text style={{ fontFamily: 'Montserrat-Regular', color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        This helps us scan your wallet faster.
                    </Text>
                </View>

                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Input
                        containerStyle={{
                            width: '90%',
                            marginLeft: 20,
                        }}
                        inputContainerStyle={{
                            borderColor: 'lightgrey',
                            borderWidth: 1,
                            borderRadius: 2,
                        }}
                        label={this.props.label}
                        labelStyle={{
                            marginBottom: 5,
                            marginRight: 2,
                        }}
                        keyboardType={'number-pad'}
                        inputStyle={{
                            color: this.props.screenProps.theme.primaryColour,
                            fontSize: 30,
                            marginLeft: 5
                        }}
                        errorMessage={this.state.errorMessage}
                        value={this.state.value}
                        onChangeText={(text) => this.onChangeText(text)}
                    />
                </View>

                <BottomButton
                    title='Continue'
                    onPress={() => this.props.navigation.navigate('ImportKeysOrSeed', { scanHeight: Number(this.state.value) })}
                    disabled={!this.state.valid}
                    {...this.props}
                />
            </View>
        );
    }
}

export class PickBlockHeightScreen extends React.Component {
    static navigationOptions = {
        title: '',
    };

    constructor(props) {
        super(props);

        /* Guess the current height of the blockchain */
        const height = getApproximateBlockHeight(new Date());

        /* Divide that height into jumps */
        const jumps = Math.floor(height / 6);

        /* Get the nearest multiple to round up to for the jumps */
        const nearestMultiple = 10 ** (jumps.toString().length - 1)

        const remainder = jumps % nearestMultiple;

        /* Round the jump to the nearest multiple */
        const roundedJumps = jumps - remainder + nearestMultiple;

        const actualJumps = [];

        /* Put together the jump ranges */
        for (let i = 0; i < height; i += roundedJumps) {
            actualJumps.push([i, i + roundedJumps]);
        }

        this.state = {
            jumps: actualJumps,
        }
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
                    <Text style={{fontFamily: 'Montserrat-SemiBold', color: this.props.screenProps.theme.primaryColour, fontSize: 25, marginBottom: 5 }}>
                        Between which block heights did you create your wallet?
                    </Text>

                    <Text style={{ fontFamily: 'Montserrat-Regular',color: this.props.screenProps.theme.primaryColour, fontSize: 16, marginBottom: 60 }}>
                        This helps us scan your wallet faster.
                    </Text>
                </View>

                <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                    {this.state.jumps.map(([startHeight, endHeight]) => {
                        return(
                            <View
                                key={startHeight}
                                style={[
                                    Styles.buttonContainer, {
                                        alignItems: 'stretch',
                                        width: '100%',
                                        marginTop: 5,
                                        marginBottom: 5,
                                    }
                                ]}
                            >
                                <Button
                                    title={startHeight + ' - ' + endHeight}
                                    onPress={() => this.props.navigation.navigate('ImportKeysOrSeed', { scanHeight: startHeight })}
                                    color={this.props.screenProps.theme.buttonColour}
                                />
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    }
}
