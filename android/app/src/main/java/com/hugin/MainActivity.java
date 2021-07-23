package com.hugin;

import com.facebook.react.ReactActivity;
import android.view.WindowManager;
import android.view.View;
import android.os.Build;
import android.os.Bundle;

public class MainActivity extends ReactActivity {
  @Override
      protected void onCreate(Bundle savedInstanceState) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
              WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams();
              layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
              getWindow().setAttributes(layoutParams);
              getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
              getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
          }
          super.onCreate(savedInstanceState);
          hideNavigationBar();
      }

      @Override
      public void onWindowFocusChanged(boolean hasFocus) {
          super.onWindowFocusChanged(hasFocus);
          if (hasFocus) {
              hideNavigationBar();
          }
      }

      private void hideNavigationBar() {
          getWindow().getDecorView().setSystemUiVisibility(
              View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
              | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

      }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    // @Override
    //     protected void onCreate(Bundle savedInstanceState) {
    //     if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    //         WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams();
    //         layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    //         getWindow().setAttributes(layoutParams);
    //         getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    //         getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
    //     }
    //
    //     super.onCreate(savedInstanceState);
    // }

    protected String getMainComponentName() {
        return "Hugin Messenger";
    }
}
