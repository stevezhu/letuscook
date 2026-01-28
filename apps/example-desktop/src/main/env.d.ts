/// <reference types="electron-vite/node" />
/// <reference types="example-server/worker-configuration" />

interface ImportMetaEnv {
  readonly MAIN_VITE_API_BASE_URL: string;
}
