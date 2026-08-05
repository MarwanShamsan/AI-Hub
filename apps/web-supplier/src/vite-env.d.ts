/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_LANDING_URL?: string;
  readonly VITE_CLIENT_PORTAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}