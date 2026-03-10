/// <reference types="vite/client" />
/// <reference types="assistant-server/worker-configuration" />

interface ImportMetaEnv {
  readonly VITE_PRODUCT_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
