import { GraphQLClient, gql } from "graphql-request";
import { COOKIE_CORBADO_SESSION, getCookie } from "~/cookies.server";
import type { Meeting, User } from "~/types";

export const getApiClient = ({
  endpoint,
  headers,
}: {
  endpoint: string;
  headers: Headers;
}) => {
  // https://github.com/cloudflare/workers-sdk/issues/3259#issuecomment-1751112701
  const sessionToken = getCookie(COOKIE_CORBADO_SESSION, headers);

  if (!sessionToken) return;

  return new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${sessionToken}`,
    },
    fetch,
  });
};

export const getAuthenticatedUser = async ({
  apiClient,
}: {
  apiClient: GraphQLClient;
}) => {
  const query = gql`
    query GetAuthenticatedUser {
      user {
        id
        name
      }
    }
  `;
  const { user } = await apiClient.request<{
    user: User;
  }>(query);
  return user;
};

export const upsertUser = async ({
  apiClient,
  name,
}: {
  apiClient: GraphQLClient;
  name?: string;
}) => {
  const query = gql`
    mutation UpsertUser($name: String) {
      upsertUser(name: $name) {
        id
        name
      }
    }
  `;
  const { upsertUser: user } = await apiClient.request<{
    upsertUser: User;
  }>(query);
  return user;
};

export const getMeetingParticipants = async ({
  apiClient,
  meetingId,
}: {
  apiClient: GraphQLClient;
  meetingId: string;
}) => {
  const query = gql`
    query GetMeetingPartipant($meetingId: String!) {
      meeting(id: $meetingId) {
        users {
          id
          name
        }
      }
    }
  `;
  const {
    meeting: { users },
  } = await apiClient.request<{
    meeting: { users: Meeting["users"] };
  }>(query, { meetingId });
  return users;
};

export const createMeeting = async ({
  apiClient,
}: {
  apiClient: GraphQLClient;
}) => {
  const query = gql`
    mutation CreateMeeting {
      createMeeting {
        id
      }
    }
  `;
  const { createMeeting: meeting } = await apiClient.request<{
    createMeeting: Meeting;
  }>(query);
  return meeting;
};

export const addMeetingParticipant = async ({
  apiClient,
  meetingId,
  userId,
}: {
  apiClient: GraphQLClient;
  meetingId: string;
  userId: string;
}) => {
  const mutation = gql`
    mutation AddMeetingPartipant($meetingId: String!, $userId: String!) {
      addMeetingParticipant(meetingId: $meetingId, userId: $userId) {
        id
        users {
          id
          name
        }
      }
    }
  `;
  const { addMeetingParticipant: meeting } = await apiClient.request<{
    addMeetingParticipant: Meeting;
  }>(mutation, { meetingId, userId });
  return meeting;
};

export const removeMeetingParticipant = async ({
  apiClient,
  meetingId,
  userId,
}: {
  apiClient: GraphQLClient;
  meetingId: string;
  userId: string;
}) => {
  const mutation = gql`
    mutation RemoveMeetingPartipant($meetingId: String!, $userId: String!) {
      removeMeetingParticipant(meetingId: $meetingId, userId: $userId) {
        id
        users {
          id
          name
        }
      }
    }
  `;
  const { addMeetingParticipant: meeting } = await apiClient.request<{
    addMeetingParticipant: Meeting;
  }>(mutation, { meetingId, userId });
  return meeting;
};
