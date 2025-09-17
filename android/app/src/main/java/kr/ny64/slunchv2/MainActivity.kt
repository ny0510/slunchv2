package kr.ny64.slunchv2

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.splashview.SplashView

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "slunchv2"

  override fun onCreate(savedInstanceState: Bundle?) {
    SplashView.showSplashView(this) // Show the splash screen
    super.onCreate(null)
  }

  override fun onBackPressed() {
    // Let React Native handle back press
    super.onBackPressed()
  }

  override fun finish() {
    // Override exit animation before calling super.finish()
    overridePendingTransition(0, 0)
    super.finish()
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
