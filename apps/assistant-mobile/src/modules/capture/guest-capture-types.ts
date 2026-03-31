/**
 * Defines the type of content captured by the user.
 */
export type CaptureType = 'text' | 'link' | 'task';

/**
 * Represents a capture made while the user is unauthenticated (offline guest).
 * Kept minimal for local storage.
 */
export type GuestCapture = {
  id: string;
  rawContent: string;
  captureType: CaptureType;
  capturedAt: number;
};

/**
 * A GuestCapture extended with a local-only `captureState`. This state
 * ('offline') is injected at runtime and intentionally NOT stored in
 * AsyncStorage to save space and simplify the schema.
 */
export type GuestCaptureWithState = GuestCapture & {
  captureState: 'offline';
};

/**
 * The result of an attempt to add a guest capture. We enforce a limit to
 * prevent uncontrolled local storage growth.
 */
export type AddGuestCaptureResult =
  | { status: 'ok'; capture: GuestCapture }
  | { status: 'LIMIT_REACHED' };

const VALID_CAPTURE_TYPES = new Set<string>(['text', 'link', 'task']);

/**
 * Validates that a parsed JSON value is a well-formed GuestCapture array.
 * Filters out any malformed entries to avoid crashing on corrupted data.
 */
export function validateGuestCaptures(data: unknown): GuestCapture[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is GuestCapture =>
      item != null &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.rawContent === 'string' &&
      typeof item.captureType === 'string' &&
      VALID_CAPTURE_TYPES.has(item.captureType) &&
      typeof item.capturedAt === 'number',
  );
}

/**
 * Maximum number of captures a guest can store locally before being forced to
 * sign in.
 */
export const GUEST_CAPTURE_LIMIT = 100;

/**
 * AsyncStorage key used to persist the guest captures array.
 */
export const GUEST_CAPTURES_STORAGE_KEY = 'guestCaptures';
