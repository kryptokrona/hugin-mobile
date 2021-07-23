// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import React from 'react';

import { Animated } from 'react-native';

import { delay } from './Utilities';

/**
 * Fades in or out a view depending on the props given.
 *
 * @param delay         The amount of millisecond to delay before starting the fade
 * @param startValue    The opacity to begin the fade at
 * @param endValue      The opacity to end the fade at
 * @param duration      The duration of the fade in milliseconds
 * @param style         You can apply a style to the view, like a normal view
 */
export class FadeView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            /* Whether we should delay before fading */
            delay: props.delay === undefined ? 0 : props.delay,

            /* Start at zero, or specified value */
            opacity: new Animated.Value(props.startValue === undefined ? 0 : props.startValue),

            /* End at one, or specified value */
            endValue: props.endValue === undefined ? 1 : props.endValue,

            /* Milliseconds the animation should last for */
            duration: props.duration === undefined ? 2000 : props.duration,
        }
    }

    componentDidMount() {
        (async () => {
            await delay(this.state.delay);

            Animated.timing(
                this.state.opacity, {
                    toValue: this.state.endValue,
                    duration: this.state.duration,
                },
            ).start();
        })();
    }

    render() {
        return(
            <Animated.View style={[{opacity: this.state.opacity}].concat(this.props.style || [])}>
                {this.props.children}
            </Animated.View>
        );
    }
}


