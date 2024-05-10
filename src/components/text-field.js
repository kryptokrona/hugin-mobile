import React from "react";
import { StyleSheet, Text } from "react-native";
import { Themes } from "../Themes";

export class TextField extends React.Component {

  constructor(props) {
    super(props);
  }
  render() {
    const { children, style, color: mColor, centered } = this.props;
    const color = mColor ?? Themes.darkMode.primaryColour;

    return <Text style={[styles.container, centered && styles.centered, { color }, style]} numberOfLines={2}>{children}</Text>;

  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    flexShrink: 1
  },
  centered: {
    textAlign: 'center',
    width: '100%'
  }
});
