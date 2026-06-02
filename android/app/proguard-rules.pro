# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep Capacitor Bridge classes and plugins
-keep class com.getcapacitor.** { *; }
-keepclasseswithmembers class * {
  @android.webkit.JavascriptInterface <methods>;
}

# Keep Cordova plugins
-keep class org.apache.cordova.** { *; }

# Maintain line numbers for debug logs
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
