import { Platform } from 'react-native';

// Номер сборки подставляет GitHub Actions (номер запуска). В разработке 0, и проверки нет.
export const BUILD_NUMBER = Number(process.env.EXPO_PUBLIC_BUILD_NUMBER) || 0;

const LATEST_RELEASE = 'https://api.github.com/repos/Kirill-bape/gym-app1/releases/latest';

export interface AppUpdate {
  build: number;
  url: string; // прямая ссылка на APK
}

interface Release {
  tag_name?: string;
  assets?: { name?: string; browser_download_url?: string }[];
}

async function fetchUpdate(): Promise<AppUpdate | null> {
  if (Platform.OS !== 'android' || !BUILD_NUMBER) return null;
  const res = await fetch(LATEST_RELEASE, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) return null;
  const release: Release = await res.json();
  const build = Number(/^build-(\d+)$/.exec(release.tag_name ?? '')?.[1]);
  const apk = release.assets?.find((a) => a.name?.endsWith('.apk'));
  if (!build || build <= BUILD_NUMBER || !apk?.browser_download_url) return null;
  return { build, url: apk.browser_download_url };
}

// Проверяем один раз за запуск приложения; без интернета просто молчим
let pending: Promise<AppUpdate | null> | null = null;
export function checkForUpdate(): Promise<AppUpdate | null> {
  pending ??= fetchUpdate().catch(() => null);
  return pending;
}
