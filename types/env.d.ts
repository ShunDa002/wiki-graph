declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BACKEND_URL?: string;
    GRAPH_REBUILD_SECRET_KEY?: string;
  }
}
