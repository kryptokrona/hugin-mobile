// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import { StyleSheet } from 'react-native';

export const Styles = StyleSheet.create({
    logo: {
        resizeMode: 'contain',
        width: 300,
        height: 300
    },
    buttonContainer: {
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowRadius: 10,
        shadowOpacity: 0.25
    },
    centeredText: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
    alignBottom: {
        position: 'relative',
        alignItems: 'stretch',
        justifyContent: 'center',
        width: '100%',
        bottom: 0,
    }
});

export const legacyRNElementsColors = {
    primary: "#9E9E9E",
    primary1: "#4d86f7",
    primary2: "#6296f9",
    secondary: "#8F0CE8",
    secondary2: "#00B233",
    secondary3: "#00FF48",
    grey0: "#393e42",
    grey1: "#43484d",
    grey2: "#5e6977",
    grey3: "#86939e",
    grey4: "#bdc6cf",
    grey5: "#e1e8ee",
    dkGreyBg: "#232323",
    greyOutline: "#bbb",
    searchBg: "#303337",
    disabled: "#dadee0",
    white: "#ffffff",
    error: "#ff190c",
};
