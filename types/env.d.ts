declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BACKEND_URL?: string;
    REBUILD_SECRET_KEY?: string;
  }
}
