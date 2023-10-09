import { UserService } from "~/services/user-service";
import { builder } from "./builder";

export interface Context {
  DB: D1Database;
  userService: UserService;
}

export interface Env {}

export const User = builder.simpleObject("User", {
  fields: (t) => ({
    id: t.string({ nullable: false }),
    name: t.string({ nullable: false }),
  }),
});
