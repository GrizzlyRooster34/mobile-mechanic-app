export default {
  expo: {
    name: "Heinicus Mobile Mechanic",
    slug: "heinicus-mobile-mechanic",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1f2937"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.heinicus.mobilemechanic",
      buildNumber: "1.0.0",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses location to find nearby mechanics and provide accurate service estimates.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses location to track service appointments and provide real-time updates.",
        NSCameraUsageDescription: "This app uses camera to capture vehicle damage photos and service documentation.",
        NSPhotoLibraryUsageDescription: "This app accesses photo library to attach images to service requests."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1f2937"
      },
      package: "com.heinicus.mobilemechanic",
      versionCode: 1,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Heinicus Mobile Mechanic to use your location to find nearby mechanics and provide accurate service estimates."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow Heinicus Mobile Mechanic to access your camera to capture vehicle damage photos and service documentation."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow Heinicus Mobile Mechanic to access your photo library to attach images to service requests."
        }
      ]
    ],
    scheme: "heinicus-mobile-mechanic",
    extra: {
      eas: {
        projectId: "your-eas-project-id"
      }
    },
    owner: "grizzlyrooster34"
  }
};