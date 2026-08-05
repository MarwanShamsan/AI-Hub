/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT_PORTAL_URL?: string;
  readonly VITE_SUPPLIER_PORTAL_URL?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}