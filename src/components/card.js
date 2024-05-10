
import React from 'react';

import { StyleSheet, View } from 'react-native';
import { Themes } from '../Themes';

export class Card extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { children, centered, flexDirection: mFlexDirection, backgroundColor: mBackgroundColor, borderColor: mBorderColor } = this.props;
    const flexDirection = mFlexDirection ?? 'column';
    const backgroundColor = mBackgroundColor ?? Themes.darkMode.backgroundEmphasis;
    const borderColor = mBorderColor ?? Themes.darkMode.borderColour;
    const alignItems = centered && 'center';

    if (!children) {
      return null;
    }

    return (
      <View style={[styles.container, { backgroundColor, flexDirection, alignItems, borderColor }]}>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
    margin: 4,
  }
});
