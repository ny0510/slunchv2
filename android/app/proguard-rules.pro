# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Widget 클래스들 보호
-keep class kr.ny64.slunchv2.widget.** { *; }
-keepclassmembers class kr.ny64.slunchv2.widget.** { *; }

# WidgetBridgeModule 보호
-keep class kr.ny64.slunchv2.widget.WidgetBridgeModule { *; }
-keepclassmembers class kr.ny64.slunchv2.widget.WidgetBridgeModule { *; }

# AppWidgetProvider 관련 클래스 보호
-keep public class * extends android.appwidget.AppWidgetProvider { *; }

# OkHttp 관련 규칙
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }

# JSON 파싱 관련
-keep class org.json.** { *; }

# React Native 모듈 관련
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.proguard.annotations.KeepGettersAndSetters class *
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.CatalystInstanceImpl { *; }
-keep,includedescriptorclasses class com.facebook.react.bridge.JavaScriptExecutor { *; }
-keep,includedescriptorclasses class com.facebook.react.bridge.queue.NativeRunnable { *; }
-keep,includedescriptorclasses class com.facebook.react.bridge.ReadableType { *; }

# Native 메서드 보호
-keepclassmembers class * {
    native <methods>;
}

# Kotlin 관련 보호
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}
-keep class kotlin.** { *; }
-keep class kotlin.reflect.** { *; }
-dontwarn kotlin.reflect.**
-keepattributes RuntimeVisibleAnnotations

# MainActivity 보호
-keep class kr.ny64.slunchv2.MainActivity { *; }
-keep class kr.ny64.slunchv2.MainApplication { *; }

# Firebase 관련
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Sentry 관련
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# AndroidX 관련
-keep class androidx.** { *; }
-dontwarn androidx.**

# Hermes 관련
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# R8 관련 경고 무시
-dontwarn java.lang.invoke.StringConcatFactory

# 속성 유지
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses
-keepattributes EnclosingMethod
