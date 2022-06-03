package com.hugin;

import com.hugin.BuildConfig;

import android.app.Application;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.soloader.SoLoader;

import com.hieuvp.fingerprint.ReactNativeFingerprintScannerPackage;

import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;

import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.security.ProviderInstaller;
import com.google.android.gms.security.ProviderInstaller.ProviderInstallListener;

import io.sentry.RNSentryPackage;

import java.util.List;
import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Response;
import okhttp3.Request;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here
      packages.add(new RNBackgroundFetchPackage());
      packages.add(new TurtleCoinPackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    upgradeSecurityProvider();

    /* tonchan-vx.x.x */
    setUserAgent("hugin-messenger-v0.0.4");

    SoLoader.init(this, /* native exopackage */ false);
  }

  public void setUserAgent(String userAgent) {
    OkHttpClientProvider.setOkHttpClientFactory(new UserAgentClientFactory(userAgent));
  }

  private void upgradeSecurityProvider() {
    ProviderInstaller.installIfNeededAsync(this, new ProviderInstallListener() {
      @Override
      public void onProviderInstalled() {
      }

      @Override
      public void onProviderInstallFailed(int errorCode, Intent recoveryIntent) {
        GooglePlayServicesUtil.showErrorNotification(errorCode, MainApplication.this);
      }
    });
  }
}

class UserAgentInterceptor implements Interceptor {

    String userAgent;

    public UserAgentInterceptor(String userAgent) {
        this.userAgent = userAgent;
    }

    @Override
    public Response intercept(Interceptor.Chain chain) throws IOException {
        Request originalRequest = chain.request();
        Request correctRequest = originalRequest.newBuilder()
            .removeHeader("User-Agent")
            .addHeader("User-Agent", this.userAgent)
            .build();

        return chain.proceed(correctRequest);
    }
}

class UserAgentClientFactory implements OkHttpClientFactory {

    String userAgent;

    public UserAgentClientFactory(String userAgent) {
        this.userAgent = userAgent;
    }

    @Override
    public OkHttpClient createNewNetworkModuleClient() {
        return com.facebook.react.modules.network.OkHttpClientProvider.createClientBuilder()
                  .addInterceptor(new UserAgentInterceptor(this.userAgent)).build();
    }
}
