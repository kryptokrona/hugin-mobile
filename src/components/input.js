
import React from 'react';
import { Themes } from '../Themes';
import { StyleSheet } from 'react-native';

import { Input } from 'react-native-elements';

export class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
    };
  }

  render() {
    return (
      <Input
        {...this.props}
        containerStyle={
          styles.container
        }
        inputContainerStyle={styles.inputContainer}
        labelStyle={
          [styles.label,
          { color: this.props.labelColour ?? Themes.darkMode.primaryColour }]
        }
        inputStyle={
          [styles.input,
          {
            color: this.props.primaryColour ?? Themes.darkMode.primaryColour,
            backgroundColor: this.props.backgroundColour ?? Themes.darkMode.backgroundColour
          }]
        }
        label={this.props.label}
        value={this.props.group}
        onChangeText={this.props.onChangeText}
        errorMessage={this.props.errorMessage}
        maxLength={this.props.maxLength ?? null}
        autoCapitalize={this.props.autoCapitalize ?? 'sentences'}
        editable={this.props.editable ?? true}
        placeholder={this.props.placeholder ?? ''}
        onEndEditing={this.props.onEndEditing ?? null}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 15,
    marginHorizontal: 0,
    fontFamily: 'Montserrat-Regular',
  },
  input: {
    borderRadius: 15,
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  label: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginBottom: 5,
    marginRight: 2,
  },
  inputContainer: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderColor: 'transparent'
  }
});
