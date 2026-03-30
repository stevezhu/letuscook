/**
 * Use polyfill-force because we know Hermes doesn't support these apis.
 * References:
 * https://formatjs.github.io/docs/polyfills/intl-pluralrules/#react-native
 * https://github.com/formatjs/formatjs/issues/4463
 * https://github.com/formatjs/formatjs/blob/main/packages/intl-localematcher/README.md#three-tier-optimization
 */

import '@formatjs/intl-locale/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill-force.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-relativetimeformat/polyfill-force.js';
import '@formatjs/intl-relativetimeformat/locale-data/en.js';
