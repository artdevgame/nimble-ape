import { GraphQLError } from "graphql";
import { builder } from "./builder";
import { User } from "./types";

builder.queryType({
  fields: (t) => ({
    user: t.field({
      type: User,
      args: {
        id: t.arg.string(),
      },
      resolve: async (_, { id }, { userService }) => {
        const user = id
          ? await userService.getUserWithId(id)
          : await userService.getAuthenticatedUser();
        if (!user) {
          throw new GraphQLError(`User not found`, {
            extensions: { code: "USER_NOT_FOUND" },
          });
        }
        return user;
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    upsertUser: t.field({
      type: User,
      authScopes: { user: true },
      args: {
        name: t.arg.string(),
      },
      resolve: async (_, args, { userService }) => {
        const user = await userService.upsertUser({
          name: args.name ?? undefined,
        });
        if (!user) {
          throw new GraphQLError("Unable to upsert user", {
            extensions: { code: "USER_UPSERT_FAILED" },
          });
        }
        return user;
      },
    }),
  }),
});

export const schema = builder.toSchema();
