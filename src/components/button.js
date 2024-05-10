import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Themes } from "../Themes";

export class Button extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { children, onPress, backgroundColor: mBackgroundColor, borderColor: mBorderColor, color: mColor, style, icon, disabled, primary } = this.props;
    const backgroundColor = mBackgroundColor ?? Themes.darkMode.backgroundEmphasis;
    const borderColor = mBorderColor ?? primary ? Themes.darkMode.primaryColour : Themes.darkMode.borderColour;
    const color = mColor ?? Themes.darkMode.primaryColour;

    if (!onPress || !children) {
      return null;
    }

    return (
      <TouchableOpacity style={[styles.container, style, { backgroundColor, borderColor, color }]} onPress={onPress} disabled={disabled} >
        {icon}
        {children}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
    marginVertical: 4,
    // overflow: 'hidden',
    alignItems: 'center',
    flex: 1,
    minHeight: 50
  }
});
