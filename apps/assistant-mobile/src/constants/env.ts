export const WORKOS_CLIENT_ID = ensureVar(
  process.env['EXPO_PUBLIC_WORKOS_CLIENT_ID'],
  'EXPO_PUBLIC_WORKOS_CLIENT_ID is not set',
);

export const CONVEX_URL = ensureVar(
  process.env['EXPO_PUBLIC_CONVEX_URL'],
  'EXPO_PUBLIC_CONVEX_URL is not set',
);

function ensureVar<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}
