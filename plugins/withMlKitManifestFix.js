const { withAndroidManifest, AndroidConfig } = require("@expo/config-plugins");

const META_DATA_NAME = "com.google.mlkit.vision.DEPENDENCIES";

// Both the on-device background remover (@six33/react-native-bg-removal,
// value "subject_segment") and expo-dev-launcher's QR scanner (value
// "barcode_ui") declare this same meta-data key with different values.
// The Android manifest merger can't auto-resolve that and fails the build
// (only surfaces in dev-client builds, since expo-dev-launcher isn't
// bundled in production). Declaring it ourselves with both values
// comma-separated — and tools:replace to win the merge — keeps both
// libraries' ML Kit module working.
const COMBINED_VALUE = "subject_segment,barcode_ui";

module.exports = function withMlKitManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = AndroidConfig.Manifest.ensureToolsAvailable(config.modResults);
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_NAME,
      COMBINED_VALUE
    );

    const item = mainApplication["meta-data"]?.find(
      (entry) => entry.$["android:name"] === META_DATA_NAME
    );
    if (item) {
      item.$["tools:replace"] = "android:value";
    }

    return config;
  });
};
