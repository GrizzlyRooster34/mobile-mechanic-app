# ProGuard rules for Heinicus Mobile Mechanic - Optimized for production builds
# This file contains comprehensive rules for React Native, Expo, and third-party libraries

# ==============================================================================
# BASIC ANDROID & JAVA OPTIMIZATIONS
# ==============================================================================

# Remove debug logs in production
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Keep line numbers for better crash reports
-keepattributes LineNumberTable,SourceFile
-renamesourcefileattribute SourceFile

# Keep annotations for reflection
-keepattributes *Annotation*

# Keep generic signatures for type safety
-keepattributes Signature

# Keep inner classes for proper reflection
-keepattributes InnerClasses,EnclosingMethod

# ==============================================================================
# REACT NATIVE CORE RULES
# ==============================================================================

# Keep React Native core classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.fbreact.** { *; }
-keep class com.facebook.reactnative.** { *; }

# Keep Hermes engine
-keep class com.facebook.hermes.** { *; }

# Keep JSC (JavaScript Core) fallback
-keep class org.webkit.** { *; }

# React Native bridge
-keep class com.facebook.react.bridge.** { *; }
-keepclassmembers class com.facebook.react.bridge.** { *; }

# React Native modules
-keep class com.facebook.react.modules.** { *; }

# React Native views and components  
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep TurboModules (New Architecture)
-keep class com.facebook.react.turbomodule.** { *; }
-keep interface com.facebook.react.turbomodule.** { *; }

# Keep Fabric renderer (New Architecture)
-keep class com.facebook.react.fabric.** { *; }

# ==============================================================================
# REACT NATIVE REANIMATED
# ==============================================================================

-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Reanimated worklets
-keep class * extends com.swmansion.reanimated.WorkletFunction { *; }

# ==============================================================================
# EXPO SPECIFIC RULES
# ==============================================================================

# Expo modules core
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }

# Expo-specific modules
-keep class abi**.expo.modules.** { *; }

# Keep Expo constants
-keep class expo.modules.constants.** { *; }

# Expo camera module
-keep class expo.modules.camera.** { *; }

# Expo location module
-keep class expo.modules.location.** { *; }

# Expo notifications
-keep class expo.modules.notifications.** { *; }

# Expo file system
-keep class expo.modules.filesystem.** { *; }

# Expo image picker
-keep class expo.modules.imagepicker.** { *; }

# ==============================================================================
# THIRD-PARTY LIBRARIES
# ==============================================================================

# OkHttp (Networking)
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Okio (OkHttp dependency)
-keep class okio.** { *; }
-dontwarn okio.**

# Fresco (Image loading)
-keep class com.facebook.fresco.** { *; }
-keep class com.facebook.imagepipeline.** { *; }
-keep class com.facebook.cache.** { *; }

# Glide (Alternative image loading)
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class com.bumptech.glide.** { *; }

# GSON (JSON parsing)
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Jackson (JSON parsing alternative)
-keep class com.fasterxml.jackson.** { *; }
-keep @com.fasterxml.jackson.annotation.JsonIgnoreProperties class * { *; }
-keep @com.fasterxml.jackson.annotation.JsonCreator class * { *; }

# ==============================================================================
# STRIPE PAYMENT PROCESSING
# ==============================================================================

-keep class com.stripe.** { *; }
-keep interface com.stripe.** { *; }
-dontwarn com.stripe.**

# ==============================================================================
# ANALYTICS & CRASH REPORTING
# ==============================================================================

# Sentry error reporting
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# Firebase (if used)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ==============================================================================
# NATIVE MODULES & KOTLIN
# ==============================================================================

# Keep all native module interfaces
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }

# Kotlin specific rules
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# Keep Kotlin coroutines
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# ==============================================================================
# APP-SPECIFIC RULES
# ==============================================================================

# Keep application main activity
-keep class com.heinicusmobilemechanic.MainActivity { *; }
-keep class com.heinicusmobilemechanic.MainApplication { *; }

# Keep model classes (adjust package names as needed)
-keep class com.heinicusmobilemechanic.models.** { *; }

# Keep API interfaces
-keep interface com.heinicusmobilemechanic.api.** { *; }

# ==============================================================================
# REFLECTION & SERIALIZATION
# ==============================================================================

# Keep classes that use reflection
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ==============================================================================
# OPTIMIZATION SETTINGS
# ==============================================================================

# Enable aggressive optimizations
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Remove unused code more aggressively
-dontshrink
-dontoptimize

# ==============================================================================
# WARNING SUPPRESSIONS
# ==============================================================================

# Suppress warnings for missing classes that are only used on other platforms
-dontwarn java.awt.**
-dontwarn javax.swing.**
-dontwarn sun.misc.**

# React Native specific warnings
-dontwarn com.facebook.infer.**
-dontwarn com.google.errorprone.annotations.**

# ==============================================================================
# DEBUGGING SUPPORT
# ==============================================================================

# Keep stack traces readable
-keepattributes StackMapTable

# Print configuration for debugging ProGuard rules
-printconfiguration proguard-config.txt
-printusage unused-code.txt
