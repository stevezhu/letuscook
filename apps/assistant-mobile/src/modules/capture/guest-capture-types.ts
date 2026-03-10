export type CaptureType = 'text' | 'link' | 'task';

export type GuestCapture = {
  id: string;
  rawContent: string;
  captureType: CaptureType;
  capturedAt: number;
};

export type GuestCaptureWithState = GuestCapture & {
  captureState: 'offline';
};

export type AddGuestCaptureResult =
  | { status: 'ok'; capture: GuestCapture }
  | { status: 'LIMIT_REACHED' };

export const GUEST_CAPTURE_LIMIT = 100;
export const GUEST_CAPTURES_STORAGE_KEY = 'guest_captures';
