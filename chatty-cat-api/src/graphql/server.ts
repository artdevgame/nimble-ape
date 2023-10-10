import { createYoga, Plugin } from "graphql-yoga";

import { schema } from "./schema";
import { Context, Env } from "./types";
import { AuthenticatedUser, UserService } from "~/services/user-service";

import * as jwt from "@tsndr/cloudflare-worker-jwt";
import { MeetingService } from "~/services/meeting-service";

const useUserService: Plugin<Context> = {
  onParse({ context, extendContext }) {
    const authorizationHeader = context.request.headers.get("authorization");
    const [, token] = authorizationHeader?.split(" ") ?? [];
    const payload = token ? jwt.decode(token).payload : null;
    const authenticatedUser: AuthenticatedUser = payload?.sub
      ? { id: payload.sub, name: payload.name ?? "" }
      : null;
    extendContext({
      meetingService: new MeetingService(context.DB),
      userService: new UserService(context.DB, authenticatedUser),
    });
  },
};

export const yoga = createYoga<Env & ExecutionContext>({
  schema,
  plugins: [useUserService],
});
