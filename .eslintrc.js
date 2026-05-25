module.exports = {
  extends: "expo",
  ignorePatterns: ["node_modules/", ".expo/", "dist/", "coverage/"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
  },
};
