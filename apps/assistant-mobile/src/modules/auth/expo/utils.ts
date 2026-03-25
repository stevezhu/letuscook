/**
 * Parse JWT payload without verification (for reading claims only)
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export function parseJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1];
  if (!base64) {
    throw new Error('Invalid JWT token');
  }
  // Handle URL-safe base64
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(normalized));
}
