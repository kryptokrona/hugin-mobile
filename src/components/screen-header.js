import React from "react";

import { StyleSheet, View, Text } from "react-native";

import { Themes } from "../Themes";

export class ScreenHeader extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { children, style } = this.props;

    const color = Themes.darkMode.primaryColour;

    return children && (
      <View style={[styles.container, style, { color }]}>
        <Text style={styles.text}>{children}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    fontFamily: "Montserrat-SemiBold",
    marginVertical: 16
  },
  text: {
    fontSize: 24,
    fontFamily: "Montserrat-SemiBold",
    flexShrink: 1
  }
});
