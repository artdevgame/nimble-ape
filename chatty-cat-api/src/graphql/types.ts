import { UserService } from "~/services/user-service";
import { builder } from "./builder";
import { MeetingService } from "~/services/meeting-service";

export interface Context {
  DB: D1Database;
  meetingService: MeetingService;
  userService: UserService;
}

export interface Env {}

export const User = builder.simpleObject("User", {
  fields: (t) => ({
    id: t.string({ nullable: false }),
    name: t.string({ nullable: false }),
  }),
});

export const Meeting = builder.simpleObject("Meeting", {
  fields: (t) => ({
    id: t.string({ nullable: false }),
    users: t.field({ type: [User] }),
  }),
});
