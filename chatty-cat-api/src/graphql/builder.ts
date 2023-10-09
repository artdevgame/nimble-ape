import SchemaBuilder from "@pothos/core";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import { Context } from "./types";
import { GraphQLError } from "graphql";

export const builder = new SchemaBuilder<{
  AuthScopes: {
    user: boolean;
  };
  Context: Context;
}>({
  scopeAuthOptions: {
    treatErrorsAsUnauthorized: true,
    unauthorizedError: () => {
      throw new GraphQLError(`Not authorised`, {
        extensions: { code: "UNAUTHORISED" },
      });
    },
  },
  plugins: [ScopeAuthPlugin, SimpleObjectsPlugin],
  authScopes: async ({ userService }) => ({
    user: userService.isAuthenticated(),
  }),
});
