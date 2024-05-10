import React from "react";

import { StyleSheet, View } from "react-native";
import { Themes } from "../Themes";

export class ScreenLayout extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { children, style } = this.props;
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Themes.darkMode.backgroundColour,
    padding: 12,
    alignItems: 'stretch'
  }
});
