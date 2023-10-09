import { GraphQLClient } from "graphql-request";
import { COOKIE_CORBADO_SESSION, getCookie } from "~/cookies.server";

const endpoint = "http://127.0.0.1:8787/graphql";

export const getApiClient = (request: Request) => {
  const sessionToken = getCookie(COOKIE_CORBADO_SESSION, request.headers);

  if (!sessionToken) return;

  return new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${sessionToken}`,
    },
    fetch,
  });
};
