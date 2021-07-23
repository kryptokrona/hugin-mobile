// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import * as React from 'react';

import { StyleSheet, ScrollView } from 'react-native';

import { legacyRNElementsColors } from './Styles';

const styles = StyleSheet.create({
    listContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderColor: legacyRNElementsColors.greyOutline,
        backgroundColor: legacyRNElementsColors.white,
    },
});

export default class ListContainer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <ScrollView style={[styles.listContainer, this.props.style]}>
                {this.props.children}
            </ScrollView>
        );
    }
}
