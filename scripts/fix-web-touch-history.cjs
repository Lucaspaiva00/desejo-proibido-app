const { readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

const root = dirname(require.resolve("react-native-web/package.json"));
for (const directory of ["src", "dist", "dist/cjs"]) {
  const file = join(root, directory, "modules/useResponderEvents/ResponderTouchHistoryStore.js");
  const source = readFileSync(file, "utf8");
  if (source.includes("Recover the remaining browser touch")) continue;

  const diagnostic = /        if \(__DEV__\) \{\n          (?:const|var) activeRecord = touchBank\[touchHistory.indexOfSingleActiveTouch\];\n          if \(!\(activeRecord != null && activeRecord.touchActive\)\) \{\n            console.error\('Cannot find single active touch\.'\);\n          \}\n        \}/;
  if (!diagnostic.test(source)) throw new Error("Revisar correção de toque do React Native Web.");

  writeFileSync(file, source.replace(diagnostic, `        // Recover the remaining browser touch if its start was missed.
        const remainingTouch = nativeEvent.touches[0];
        const remainingRecord = touchBank[remainingTouch.identifier];
        if (!remainingRecord || !remainingRecord.touchActive) {
          recordTouchStart(remainingTouch, touchHistory);
        }
        touchHistory.indexOfSingleActiveTouch = remainingTouch.identifier;`));
}
