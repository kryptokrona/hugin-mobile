// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import { Animated, Text, Image } from 'react-native';

export class XKRLogo extends React.Component {
    constructor(props) {
        super(props);
        this.animation = new Animated.Value(0);
    }


    componentWillMount() {
      this.animatedValue = new Animated.Value(0);
    }

    componentDidMount() {

      let flipFlop = false;

      let keepAnimating = () => {

        Animated.timing(this.animatedValue, {
          toValue: flipFlop ? 0 : 224,
          duration: 3000
        }).start(() => {
          flipFlop = flipFlop ? false : true;
          keepAnimating();
        });

      }

        Animated.timing(this.animatedValue, {
          toValue: 224,
          duration: 3000
        }).start(() => {
          keepAnimating();

    });
    }

    render() {

       const interpolateColor =  this.animatedValue.interpolate({
       inputRange: [0, 32, 64, 96, 128, 160, 192, 224],
       outputRange:['#5f86f2','#a65ff2','#f25fd0','#f25f61','#f2cb5f','#abf25f','#5ff281','#5ff2f0']
     });

        return(
            <Animated.View style={{
                backgroundColor: interpolateColor,
                borderRadius: 150,
                width: 250,
                height: 250
            }}>
            <Image
              style={{width: 300, height: 250, marginLeft: -25, marginTop: 4}}
              source={require('../assets/img/hugin.png')}
            />
            </Animated.View>
        );
    }
}
