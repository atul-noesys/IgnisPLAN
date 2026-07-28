/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INFOVEAVE_TENANT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
