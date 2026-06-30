const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Safety net: expo-media-library is configured with granularPermissions:[] in app.json
// to avoid adding these. This plugin removes them in case any dependency re-adds them.
const PERMISSIONS_TO_REMOVE = [
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_AUDIO",
];

module.exports = function withRemoveMediaPermissions(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/AndroidManifest.xml"
      );
      if (!fs.existsSync(manifestPath)) return config;

      let manifest = fs.readFileSync(manifestPath, "utf-8");
      for (const permission of PERMISSIONS_TO_REMOVE) {
        const escapedPerm = permission.replace(/\./g, "\\.");
        manifest = manifest.replace(
          new RegExp(`[ \\t]*<uses-permission android:name="${escapedPerm}"\\/>\\r?\\n?`, "g"),
          ""
        );
      }
      fs.writeFileSync(manifestPath, manifest, "utf-8");
      return config;
    },
  ]);
};
