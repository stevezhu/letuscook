/**
 * Parse JWT payload without verification (for reading claims only)
 *
 * 👀 Needs Verification
 */
export function parseJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1];
  if (!base64) {
    throw new Error('Invalid JWT: missing payload segment');
  }
  // Handle URL-safe base64
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const parsed: unknown = JSON.parse(atob(normalized));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Invalid JWT: payload is not an object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JWT: malformed payload');
    }
    throw error;
  }
}
