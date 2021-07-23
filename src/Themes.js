// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

export const Themes = {
    lightMode: {
        /**
         * Background colour for every component
         */
        backgroundColour: '#F4F3F6',

        /**
         * The primary colour used by the wallet, for TurtleCoin this is green
         */
        primaryColour: 'rgb(83,86,92)',

        buttonColour: '#888888',

        borderColour: 'rgba(0,0,0,0.1)',

        /**
         * Colour for the background circles on the pin page
         */
        pinCodeBackgroundColour: '#ffffff',

        /**
         * Colour for the pin code numbers
         * Note that when you click them, a different theme is applied.
         */
        pinCodeForegroundColour: 'rgb(83,86,92)',

        /**
         * We chose to use a darker green here. It is very rarely used.
         */
        secondaryColour: '#FBBF2E',

        /**
         * Terrible name, lol. This is used things which shouldn't pop out
         * much, like the 'TOTAL BALANCE' text.
         */
        notVeryVisibleColour: 'lightgray',

        /**
         * This is used for the same sort of things as notVeryVisibleColour,
         * but pops out a little more. Used for things like the $ balance value.
         */
        slightlyMoreVisibleColour: 'gray',

        /**
         * Colour for disabled things, like bottom buttons
         */
        disabledColour: '#DADEE0',

        /**
         * Colour for the address book icon background
         */
        iconColour: 'ghostwhite',

        /**
         * Filepath of the logo to use.
         */
        logo: require('../assets/img/logo-dark.png'),

        spinnerLogo: require('../assets/img/logo-dark.png'),

        animatedLogo: require('../assets/img/xkr-logo-light.gif'),

        balanceBackground: require('../assets/img/balance-bg.gif'),

        qrCode: {
            /**
             * Your foreground colour needs to be a darkish colour, or the
             * code will not scan.
             */
            foregroundColour: 'rgb(83,86,92)',

            /**
             * Your background colour needs to be a lightish colour, or the
             * code will not scan.
             */
            backgroundColour: '#F4F3F6',
        },
    },
    darkMode: {
        /**
         * Background colour for every component
         */
        backgroundColour: '#1B1B1B',

        /**
         * The primary colour used by the wallet, for TurtleCoin this is green
         */
        primaryColour: 'rgba(255,255,255,0.8)',

        buttonColour: '#161616',

        borderColour: 'rgba(255,255,255,0.1)',

        /**
         * Colour for the background circles on the pin page
         */
        pinCodeBackgroundColour: '#171416',

        /**
         * Colour for the pin code numbers
         * Note that when you click them, a different theme is applied.
         */
        pinCodeForegroundColour: 'rgba(255,255,255,0.5)',

        /**
         * We chose to use a darker green here. It is very rarely used.
         */
        secondaryColour: '#FBBF2E',

        /**
         * Terrible name, lol. This is used things which shouldn't pop out
         * much, like the 'TOTAL BALANCE' text.
         */
        notVeryVisibleColour: 'rgba(255,255,255,0.1)',

        /**
         * This is used for the same sort of things as notVeryVisibleColour,
         * but pops out a little more. Used for things like the $ balance value.
         */
        slightlyMoreVisibleColour: 'rgba(255,255,255,0.3)',

        /**
         * Colour for disabled bottom buttons
         */
        disabledColour: '#23272A',

        /**
         * Colour for the address book icon background
         */
        iconColour: '#23272A',

        /**
         * Filepath of the logo to use.
         */
        logo: require('../assets/img/logo-white.png'),

        spinnerLogo: require('../assets/img/logo-white-shadow.png'),

        animatedLogo: require('../assets/img/xkr-logo-dark.gif'),

        balanceBackground: require('../assets/img/balance-bg.gif'),

        qrCode: {
            /**
             * Your foreground colour needs to be a darkish colour, or the
             * code will not scan.
             */
            foregroundColour: '#dddddd',

            /**
             * Your background colour needs to be a lightish colour, or the
             * code will not scan.
             */
            backgroundColour: '#212121',
        },
    },
}
