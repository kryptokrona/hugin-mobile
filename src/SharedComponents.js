// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import * as _ from 'lodash';

import React from 'react';

import { Platform, View, Clipboard, Text } from 'react-native';

import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/dist/FontAwesome';
import Config from './Config';

import { Styles } from './Styles';
import { toastPopUp } from './Utilities';

export class TextFixedWidth extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const fontFamily = Platform.OS === 'ios' ? 'Courier' : 'monospace'

        return (
            <Text style={{
                fontFamily,
                fontSize: 12,
                color: this.props.screenProps.theme.slightlyMoreVisibleColour,
            }}>
                {this.props.children}
            </Text>
        );
    }
}

/**
 * Display the seed in a nice way
 */
export class SeedComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const split = this.props.seed.split(' ');
        const lines = _.chunk(split, 5);

        return(
            <View>
                <View style={{
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: this.props.borderColour,
                    padding: 10
                }}>
                    <TextFixedWidth {...this.props}>
                        {lines[0].join(' ')}
                    </TextFixedWidth>
                    <TextFixedWidth {...this.props}>
                        {lines[1].join(' ')}
                    </TextFixedWidth>
                    <TextFixedWidth {...this.props}>
                        {lines[2].join(' ')}
                    </TextFixedWidth>
                    <TextFixedWidth {...this.props}>
                        {lines[3].join(' ')}
                    </TextFixedWidth>
                    <TextFixedWidth {...this.props}>
                        {lines[4].join(' ')}
                    </TextFixedWidth>
                </View>
                <CopyButton
                    style={{ marginLeft: 0 }}
                    data={this.props.seed}
                    name='Seed'
                    {...this.props}
                />
            </View>
        );
    }
}

/**
 * Copy the data to clipboard
 */
export class CopyButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <View style={[{...this.props.style}, {
                marginTop: 10,
                alignItems: 'flex-start',
                borderRadius: 3,
                borderColor: this.props.screenProps.theme.borderColour,
                borderWidth: 1,
                paddingTop: 0
            }]}>
                <Button
                    title='Copy'
                    onPress={() => {
                        Clipboard.setString(this.props.data);
                        toastPopUp(this.props.name + ' copied');
                    }}
                    titleStyle={{
                        color: this.props.screenProps.theme.primaryColour,
                        textDecorationLine: 'none',
                        marginTop: -3
                    }}
                    type='clear'
                />
            </View>
        );
    }
}

export class Hr extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            width: this.props.width || '90%',
        };
    }

    render() {
        return(
            <View
                style={{
                    borderWidth: 0.7,
                    borderColor: 'lightgrey',
                    marginTop: 15,
                    width: this.state.width,
                }}
            />
        );
    }
}

export class BottomButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <View style={Styles.alignBottom}>
                <Button
                    buttonStyle={{
                        backgroundColor: this.props.screenProps.theme.buttonColour,
                        height: 50,
                        borderRadius: 5,
                        marginBottom: 48,
                        width: "50%",
                        marginLeft: "25%",
                        fontFamily: 'Montserrat-SemiBold'
                    }}
                    disabledStyle={{
                        backgroundColor: this.props.screenProps.theme.disabledColour,
                    }}
                    {...this.props}
                    title={this.props.title.toUpperCase()}
                />
            </View>
        );
    }
}

export class OR extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: 10,
            }}>
                <View style={{
                    width: '45%',
                    borderWidth: 1,
                    borderColor: 'lightgrey',
                    height: 1
                }}/>

                <Text style={{
                    fontSize: 14,
                    color: 'grey',
                }}>
                    OR
                </Text>

                <View style={{
                    width: '45%',
                    borderWidth: 1,
                    borderColor: 'lightgrey',
                    height: 1
                }}/>
            </View>
        );
    }
}

export class OneLineText extends React.Component {
    constructor(props) {
        super(props);

        if (!this.props.style || !this.props.style.fontSize) {
            throw new Error('Fontsize property is mandatory!');
        }

        if (this.props.style.fontSize === 0) {
            throw new Error('Font size cannot be zero!');
        }

        this.multiplier = this.props.multiplier || 20;
    }

    calculateFontSize(fontSize, text) {
        if (text.length === 0) {
            return fontSize;
        }

        /* Get a decent guess of the right font size to use to fit on one line */
        let maxFontSize = Math.round(((1 / text.length) / fontSize) * this.multiplier * 1000);

        return Math.min(maxFontSize, fontSize);
    }

    render() {
        return(
            <Text {...this.props} style={[{...this.props.style}, {fontSize: this.calculateFontSize(this.props.style.fontSize, this.props.children)}]}>
                {this.props.children}
            </Text>
        );
    }
}
