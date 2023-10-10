import { GraphQLError } from "graphql";
import { builder } from "./builder";
import { Meeting, User } from "./types";
import { MeetingService } from "~/services/meeting-service";
import { UserService } from "~/services/user-service";

const getMeeting = async (
  id: string,
  meetingService: MeetingService,
  userService: UserService
) => {
  const { results } = await meetingService.getUserIdsInMeeting(id);
  const users = await Promise.all(
    results.map(({ user_id }) => userService.getUserWithId(user_id))
  );
  return {
    id,
    users: users.filter(Boolean),
  } as typeof Meeting.$inferType;
};

builder.queryType({
  fields: (t) => ({
    meeting: t.field({
      type: Meeting,
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (_, { id }, { meetingService, userService }) => {
        return getMeeting(id, meetingService, userService);
      },
    }),

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
    createMeeting: t.field({
      type: Meeting,
      authScopes: { authenticated: true },
      resolve: async (_, __, { meetingService }) => {
        const { id } = await meetingService.createMeeting();
        return { id, users: [] };
      },
    }),

    addMeetingParticipant: t.field({
      type: Meeting,
      authScopes: { authenticated: true },
      args: {
        meetingId: t.arg.string({ required: true }),
        userId: t.arg.string({ required: true }),
      },
      resolve: async (
        _,
        { meetingId, userId },
        { meetingService, userService }
      ) => {
        const meeting = await meetingService.getMeetingWithId(meetingId);

        if (!meeting) {
          throw new GraphQLError(
            "Unable to add participant: Meeting not found",
            {
              extensions: { code: "ADD_PARTICIPANT_FAILED_NO_MEETING" },
            }
          );
        }

        const user = await userService.getUserWithId(userId);

        if (!user) {
          throw new GraphQLError("Unable to add participant: User not found", {
            extensions: { code: "ADD_PARTICIPANT_FAILED_NO_USER" },
          });
        }

        try {
          await meetingService.addParticipant(meetingId, userId);
        } catch (err) {
          throw new GraphQLError("Unable to add participant", {
            extensions: { code: "ADD_PARTICIPANT_FAILED" },
          });
        }
        return getMeeting(meetingId, meetingService, userService);
      },
    }),

    removeMeetingParticipant: t.field({
      type: Meeting,
      authScopes: { authenticated: true },
      args: {
        meetingId: t.arg.string({ required: true }),
        userId: t.arg.string({ required: true }),
      },
      resolve: async (
        _,
        { meetingId, userId },
        { meetingService, userService }
      ) => {
        await meetingService.removeParticipant(meetingId, userId);
        return getMeeting(meetingId, meetingService, userService);
      },
    }),

    upsertUser: t.field({
      type: User,
      authScopes: { authenticated: true },
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
