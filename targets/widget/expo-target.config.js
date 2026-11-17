/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "StopwatchWidget",
  displayName: "Cronómetro",
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit", "ActivityKit", "AppIntents"],
  colors: {
    $accent: "#FF9F0A",
  },
};
