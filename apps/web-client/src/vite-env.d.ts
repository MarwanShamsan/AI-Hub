/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL: string;
  readonly VITE_COMMAND_API_URL: string;
  readonly VITE_QUERY_API_URL: string;
  readonly VITE_REQUEST_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}