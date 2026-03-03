import { digest } from 'expo-crypto';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

polyfillWebCrypto();

if (!globalThis.crypto.subtle) {
  globalThis.crypto.subtle = { digest } as SubtleCrypto;
}
