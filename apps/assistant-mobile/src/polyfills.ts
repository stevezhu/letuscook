import { digest } from 'expo-crypto';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

polyfillWebCrypto();

if (!globalThis.crypto.subtle) {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: { digest } as SubtleCrypto,
    configurable: true,
    enumerable: true,
  });
}

import '@workspace/intl-polyfill';
