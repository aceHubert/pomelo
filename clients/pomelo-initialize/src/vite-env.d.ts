/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URI?: string;
  readonly VITE_BASIC_GRAPHQL_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
