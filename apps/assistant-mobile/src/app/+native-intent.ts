export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (new URL(path).hostname === 'expo-sharing') {
      return '/(tabs)/capture';
    }
    return path;
  } catch {
    return '/';
  }
}
