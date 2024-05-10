// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import CustomIcon from './CustomIcon.js'

import React from 'react';

import { View, StatusBar } from 'react-native';

import {
  createStackNavigator, createAppContainer, createBottomTabNavigator,
  createSwitchNavigator
} from 'react-navigation';

import { Themes } from './Themes';
import { Globals } from './Globals';
import { SplashScreen } from './SplashScreen';
import { DisclaimerScreen } from './DisclaimerScreen';
import { loadPreferencesFromDatabase, openDB } from './Database';
import { ChatScreen, ModifyPayeeScreen, RecipientsScreen, CallScreen } from './Recipients';
import { GroupChatScreen, ModifyGroupScreen, GroupsScreen, NewGroupScreen } from './Groups';
import { WalletOptionScreen, CreateWalletScreen } from './CreateScreen';

import { MainScreen } from './MainScreen'
import { TransactionsScreen, TransactionDetailsScreen } from './TransactionsScreen'
import { SendTransactionScreen, QrScannerScreen, TransferScreen, ChoosePayeeScreen, NewPayeeScreen, ConfirmScreen } from './TransferScreen.js'

import {
  SetPinScreen, RequestPinScreen, ForgotPinScreen, RequestHardwareAuthScreen,
  ChooseAuthMethodScreen,
} from './Authenticate';

import {
  SettingsScreen, SwapCurrencyScreen, ExportKeysScreen, LoggingScreen, FaqScreen,
  DisableDozeScreen, SwapNodeScreen, OptimizeScreen, SwapLanguageScreen, SwapAPIScreen
} from './SettingsScreen';

import {
  PickMonthScreen, PickBlockHeightScreen, PickExactBlockHeightScreen,
} from './ScanHeightScreen';



import {
  ImportWalletScreen, ImportKeysOrSeedScreen, ImportSeedScreen,
  ImportKeysScreen,
} from './ImportScreen';

/* Transactions screen and more info on transactions */
const TransactionNavigator = createStackNavigator(
  {
    Transactions: TransactionsScreen,
    TransactionDetails: TransactionDetailsScreen,
  },
  {
    initialRouteName: 'Transactions',
    headerLayoutPreset: 'center',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
    defaultNavigationOptions: {
      headerTitleStyle: {
        fontWeight: 'bold',
        color: 'Themes.darkMode.primaryColour',
      },
      headerTransparent: true,
      headerTintColor: Themes.darkMode.primaryColour,
    },
  }
);

TransactionNavigator.navigationOptions = ({ navigation, screenProps }) => ({
  tabBarOptions: {
    activeBackgroundColor: screenProps.theme.backgroundColour,
    inactiveBackgroundColor: screenProps.theme.backgroundColour,
    activeTintColor: screenProps.theme.primaryColour,
    inactiveTintColor: screenProps.theme.slightlyMoreVisibleColour,
    showLabel: false,
    style: {
      borderTopWidth: 0,
      height: 46,
      textAlignVertical: "bottom",
      marginBottom: 5
    }
  }
});

const TransferNavigator = createStackNavigator(
  {
    Transfer: TransferScreen,
    ChoosePayee: ChoosePayeeScreen,
    NewPayee: NewPayeeScreen,
    Confirm: ConfirmScreen,
    QrScanner: QrScannerScreen,
    SendTransaction: SendTransactionScreen,
    RequestPin: RequestPinScreen,
    RequestHardwareAuth: RequestHardwareAuthScreen,
  },
  {
    initialRouteName: 'ChoosePayee',
    headerLayoutPreset: 'center',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
    defaultNavigationOptions: {
      headerTitleStyle: {
        fontWeight: 'bold',
        color: Themes.darkMode.primaryColour,
      },
      headerTransparent: true,
      headerTintColor: Themes.darkMode.primaryColour,
    },
  }
);

TransferNavigator.navigationOptions = ({ navigation, screenProps }) => {
  return {
    tabBarVisible: navigation.state.index === 0, /* Only show tab bar on ChoosePayee */
    tabBarOptions: {
      activeBackgroundColor: screenProps.theme.backgroundColour,
      inactiveBackgroundColor: screenProps.theme.backgroundColour,
      activeTintColor: screenProps.theme.primaryColour,
      inactiveTintColor: screenProps.theme.slightlyMoreVisibleColour,
      showLabel: false,
      style: {
        borderTopWidth: 0,
        height: 46,
        textAlignVertical: "bottom",
        marginBottom: 5
      }
    }
  };
};

const SettingsNavigator = createStackNavigator(
  {
    Settings: SettingsScreen,
    SwapCurrency: SwapCurrencyScreen,
    SwapNode: SwapNodeScreen,
    SwapLanguage: SwapLanguageScreen,
    ExportKeys: ExportKeysScreen,
    Logging: LoggingScreen,
    Faq: FaqScreen,
    DisableDoze: DisableDozeScreen,
    RequestPin: RequestPinScreen,
    ForgotPin: ForgotPinScreen,
    SetPin: SetPinScreen,
    ChooseAuthMethod: ChooseAuthMethodScreen,
    RequestHardwareAuth: RequestHardwareAuthScreen,
    Optimize: OptimizeScreen,
    SwapAPI: SwapAPIScreen
  },
  {
    initialRouteName: 'Settings',
    headerLayoutPreset: 'center',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
    defaultNavigationOptions: {
      headerTitleStyle: {
        fontWeight: 'bold',
        color: Themes.darkMode.primaryColour,
      },
      headerTransparent: true,
      headerTintColor: Themes.darkMode.primaryColour,
    },
  }
);

SettingsNavigator.navigationOptions = ({ navigation, screenProps }) => ({
  tabBarOptions: {
    activeBackgroundColor: screenProps.theme.backgroundColour,
    inactiveBackgroundColor: screenProps.theme.backgroundColour,
    activeTintColor: screenProps.theme.primaryColour,
    inactiveTintColor: screenProps.theme.slightlyMoreVisibleColour,
    showLabel: false,
    style: {
      borderTopWidth: 0,
      height: 46,
      textAlignVertical: "bottom",
      marginBottom: 5
    }
  }
});

const RecipientNavigator = createStackNavigator(
  {
    Recipients: RecipientsScreen,
    ModifyPayee: ModifyPayeeScreen,
    ChatScreen: ChatScreen,
    NewPayee: NewPayeeScreen,
    CallScreen: CallScreen
  },
  {
    initialRouteName: '',
    headerLayoutPreset: 'center',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
    defaultNavigationOptions: {
      headerTitleStyle: {
        fontWeight: 'bold',
        color: Themes.darkMode.primaryColour,
      },
      headerTransparent: true,
      headerTintColor: Themes.darkMode.primaryColour,
    },
  }
);

RecipientNavigator.navigationOptions = ({ navigation, screenProps }) => ({
  tabBarOptions: {
    activeBackgroundColor: screenProps.theme.backgroundColour,
    inactiveBackgroundColor: screenProps.theme.backgroundColour,
    activeTintColor: screenProps.theme.primaryColour,
    inactiveTintColor: screenProps.theme.slightlyMoreVisibleColour,
    showLabel: false,
    style: {
      borderTopWidth: 0,
      height: 46,
      textAlignVertical: "bottom",
      marginBottom: 5
    }
  }
});


const GroupsNavigator = createStackNavigator(
  {
    Groups: GroupsScreen,
    ModifyGroup: ModifyGroupScreen,
    GroupChatScreen: GroupChatScreen,
    NewGroup: NewGroupScreen,
  },
  {
    initialRouteName: '',
    headerLayoutPreset: 'center',
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0,
      },
    }),
    defaultNavigationOptions: {
      headerTitleStyle: {
        fontWeight: 'bold',
        color: Themes.darkMode.primaryColour,
      },
      headerTransparent: true,
      headerTintColor: Themes.darkMode.primaryColour,
    },
  }
);

GroupsNavigator.navigationOptions = ({ navigation, screenProps }) => ({
  tabBarOptions: {
    activeBackgroundColor: screenProps.theme.backgroundColour,
    inactiveBackgroundColor: screenProps.theme.backgroundColour,
    activeTintColor: screenProps.theme.primaryColour,
    inactiveTintColor: screenProps.theme.slightlyMoreVisibleColour,
    showLabel: false,
    style: {
      borderTopWidth: 0,
      height: 46,
      textAlignVertical: "bottom",
      marginBottom: 5
    }
  }
});

/* Main screen for a logged in wallet */
const HomeNavigator = createBottomTabNavigator(
  {
    Main: MainScreen,
    Transactions: TransactionNavigator,
    Transfer: TransferNavigator,
    Recipients: RecipientNavigator,
    Groups: GroupsNavigator,
    Settings: SettingsNavigator,
  },
  {
    initialRouteName: 'Main',
    tabBarOptions: {
      activeBackgroundColor: Themes.darkMode.backgroundColour,
      inactiveBackgroundColor: Themes.darkMode.backgroundColour,
      activeTintColor: Themes.darkMode.primaryColour,
      showLabel: false,
      style: {
        borderTopWidth: 0,
        height: 46,
        textAlignVertical: "bottom",
        marginBottom: 5
      }

    },
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;

        let iconName;
        let IconComponent;

        if (routeName === 'Main') {
          IconComponent = CustomIcon;
          iconName = 'profile';
        } else if (routeName === 'Transactions') {
          IconComponent = CustomIcon;
          iconName = 'wallet';
        } else if (routeName === 'Transfer') {
          IconComponent = CustomIcon;
          iconName = 'money-send';
        } else if (routeName === 'Recipients') {
          IconComponent = CustomIcon;
          iconName = 'message';
        } else if (routeName === 'Settings') {
          IconComponent = CustomIcon;
          iconName = 'setting-2';
        } else if (routeName === 'Groups') {
          IconComponent = CustomIcon;
          iconName = 'messages';
        }

        return <IconComponent name={iconName} size={24} color={tintColor} />;
      },
    }),
  }
);



/* Login or create/import a wallet */
const LoginNavigator = createStackNavigator(
  {
    /* Create a wallet */
    CreateWallet: CreateWalletScreen,

    /* Set a pin for the created wallet */
    SetPin: SetPinScreen,

    /* Request the pin for an existing wallet */
    RequestPin: RequestPinScreen,

    /* Allow deleting the wallet if pin forgotten */
    ForgotPin: ForgotPinScreen,

    /* Launcing screen */
    Splash: SplashScreen,

    /* Create a wallet, import a wallet */
    WalletOption: WalletOptionScreen,

    /* Import a wallet */
    ImportWallet: ImportWalletScreen,

    /* Pick between seed or keys */
    ImportKeysOrSeed: ImportKeysOrSeedScreen,

    /* Import with a mnemonic seed */
    ImportSeed: ImportSeedScreen,

    /* Import with a set of keys */
    ImportKeys: ImportKeysScreen,

    /* Pick a month to start the wallet scanning from */
    PickMonth: PickMonthScreen,

    /* Pick a block range to start the wallet scanning from */
    PickBlockHeight: PickBlockHeightScreen,

    /* Pick a specific height to start the wallet scanning from */
    PickExactBlockHeight: PickExactBlockHeightScreen,

    /* Explain fee, I'm not responsible for anything, etc */
    Disclaimer: DisclaimerScreen,

    /* Request authentication via fingerprint, touchid, etc */
    RequestHardwareAuth: RequestHardwareAuthScreen,

    /* Whether we should use pin, fingerprint, or no auth */
    ChooseAuthMethod: ChooseAuthMethodScreen,
  },
  {
    initialRouteName: 'Splash',
    headerLayoutPreset: 'center',
    defaultNavigationOptions: {
      headerTitleStyle: {
        fontWeight: 'bold',
        color: Themes.darkMode.primaryColour,
      },
      headerTransparent: true,
      headerTintColor: Themes.darkMode.primaryColour,
    },
  }
);

const AppContainer = createAppContainer(createSwitchNavigator(
  {
    Login: {
      screen: LoginNavigator,
    },
    Home: {
      screen: HomeNavigator,
    },
  },
  {
    initialRouteName: 'Login',
  }
));

/* TODO: Need to load preferences to set theme */
export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      screenProps: {
        theme: Themes[Globals.preferences.theme],
      },
    }

    this.init();
  }

  async init() {
    await openDB();

    const prefs = await loadPreferencesFromDatabase();

    if (prefs !== undefined) {
      Globals.preferences = prefs;
    }

    console.log(Globals.preferences);

    this.setState({
      screenProps: {
        theme: Themes[Globals.preferences.theme],
      },
      loaded: true,
    });

    Globals.updateTheme = () => {
      this.setState({
        screenProps: {
          theme: Themes[Globals.preferences.theme],
        }
      });
    };
  }


  render() {
    const loadedComponent = <AppContainer screenProps={this.state.screenProps} />;
    const notLoadedComponent = <View></View>;

    return (
      <View style={{ flex: 1, backgroundColor: this.state.screenProps.theme.backgroundColour }}>
        <StatusBar />
        {this.state.loaded ? loadedComponent : notLoadedComponent}
      </View>
    );
  }
}
