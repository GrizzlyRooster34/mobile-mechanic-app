export default {
  expo: {
    name: "Heinicus Mobile Mechanic",
    slug: "heinicus-mobile-mechanic",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    splash: {
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
      bundler: "metro"
    },
    scheme: "heinicus-mobile-mechanic",
    extra: {
      eas: {
        projectId: "4ae0856b-f6e8-441c-9bef-0dc3709f56d0"
      }
    }
  }
};
