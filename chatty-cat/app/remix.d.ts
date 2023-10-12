import "@remix-run/cloudflare";

declare module "@remix-run/cloudflare" {
  export interface AppLoadContext {
    env: {
      CORBADO_PROJECT_ID: string;
      GRAPHQL_ENDPOINT: string;
    };
  }
}
