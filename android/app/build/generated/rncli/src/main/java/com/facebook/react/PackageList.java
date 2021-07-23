
package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import java.util.Arrays;
import java.util.ArrayList;

import com.hugin.BuildConfig;
import com.hugin.R;

// @react-native-community/async-storage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
// @react-native-community/netinfo
import com.reactnativecommunity.netinfo.NetInfoPackage;
// @sentry/react-native
import io.sentry.RNSentryPackage;
// react-native-camera
import org.reactnative.camera.RNCameraPackage;
// react-native-exit-app
import com.github.wumke.RNExitApp.RNExitAppPackage;
// react-native-fingerprint-scanner
import com.hieuvp.fingerprint.ReactNativeFingerprintScannerPackage;
// react-native-gesture-handler
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
// react-native-keychain
import com.oblador.keychain.KeychainPackage;
// react-native-push-notification
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
// react-native-randombytes
import com.bitgo.randombytes.RandomBytesPackage;
// react-native-sqlite-storage
import org.pgsqlite.SQLitePluginPackage;
// react-native-svg
import com.horcrux.svg.SvgPackage;
// react-native-tcp
import com.peel.react.TcpSocketsModule;
// react-native-udp
import com.tradle.react.UdpSocketsModule;
// react-native-vector-icons
import com.oblador.vectoricons.VectorIconsPackage;

public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  public PackageList(ReactNativeHost reactNativeHost) {
    this.reactNativeHost = reactNativeHost;
  }
  
  public PackageList(Application application) {
    this.reactNativeHost = null;
    this.application = application;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  private Resources getResources() {
    return this.getApplication().getResources();
  }

  private Application getApplication() {
    if (this.reactNativeHost == null) return this.application;
    return this.reactNativeHost.getApplication();
  }

  private Context getApplicationContext() {
    return this.getApplication().getApplicationContext();
  }

  public ArrayList<ReactPackage> getPackages() {
    return new ArrayList<>(Arrays.<ReactPackage>asList(
      new MainReactPackage(),
      new AsyncStoragePackage(),
      new NetInfoPackage(),
      new RNSentryPackage(),
      new RNCameraPackage(),
      new RNExitAppPackage(),
      new ReactNativeFingerprintScannerPackage(),
      new RNGestureHandlerPackage(),
      new KeychainPackage(),
      new ReactNativePushNotificationPackage(),
      new RandomBytesPackage(),
      new SQLitePluginPackage(),
      new SvgPackage(),
      new TcpSocketsModule(),
      new UdpSocketsModule(),
      new VectorIconsPackage()
    ));
  }
}
