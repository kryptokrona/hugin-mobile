// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import * as React from 'react';

import { StyleSheet } from 'react-native';

import { ListItem as RneListItem } from 'react-native-elements';

// import { legacyRNElementsColors } from './Styles';

const styles = StyleSheet.create({
  listItemContainer: {
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    backgroundColor: "#171717",
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#252525',
    marginBottom: 10,
    width: '100%',
  },
});

/* https://github.com/react-native-training/react-native-elements/issues/1565 */
const ListItem = props => (
  <RneListItem
    containerStyle={[styles.listItemContainer, props.containerStyle]}
    underlayColor='transparent'
    {...props}
  />
);

export default ListItem;
