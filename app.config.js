// Номер сборки приходит из GitHub Actions (номер запуска).
// По versionCode Android понимает, что новый APK — это обновление, и сохраняет данные.
module.exports = ({ config }) => ({
  ...config,
  android: { ...config.android, versionCode: Number(process.env.EXPO_PUBLIC_BUILD_NUMBER) || 1 },
});
