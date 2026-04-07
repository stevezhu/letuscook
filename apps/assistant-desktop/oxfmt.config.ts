import { fileURLToPath } from 'node:url';

import { defineConfig } from 'oxfmt';

export default defineConfig({
  sortTailwindcss: {
    stylesheet: fileURLToPath(
      import.meta.resolve('./src/renderer/src/main.css'),
    ),
  },
});
