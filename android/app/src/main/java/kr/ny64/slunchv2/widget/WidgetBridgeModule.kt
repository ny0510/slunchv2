package kr.ny64.slunchv2.widget

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class WidgetBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetBridge"
    }

    @ReactMethod
    fun updateWidget(mealData: String, promise: Promise) {
        try {
            MealWidgetProvider.updateWidgets(reactApplicationContext, mealData)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun forceUpdateWidget(promise: Promise) {
        try {
            val intent = Intent(MealWidgetProvider.ACTION_WIDGET_UPDATE)
            reactApplicationContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_FORCE_UPDATE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun saveSchoolInfo(schoolCode: String, regionCode: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("user_prefs", ReactApplicationContext.MODE_PRIVATE)
            prefs.edit()
                .putString("schoolCode", schoolCode)
                .putString("regionCode", regionCode)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_SCHOOL_INFO_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getSchoolInfo(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("user_prefs", ReactApplicationContext.MODE_PRIVATE)
            val schoolCode = prefs.getString("schoolCode", null)
            val regionCode = prefs.getString("regionCode", null)

            val result = hashMapOf<String, String?>()
            result["schoolCode"] = schoolCode
            result["regionCode"] = regionCode
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_SCHOOL_INFO_ERROR", e.message, e)
        }
    }

}