export interface ContextEnv {
  CORBADO_PROJECT_ID: string;
  GRAPHQL_ENDPOINT: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Meeting {
  id: string;
  users: User[];
}
