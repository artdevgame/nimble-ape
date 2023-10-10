import {
  redirect,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";
import { ClientOnly } from "remix-utils/client-only";
import { Meeting } from "~/components/chat/meeting.client";
import { getApiClient } from "~/lib/apiClient";
import type { Meeting as MeetingType, User } from "~/types";

export const meta: MetaFunction = () => {
  return [{ title: "Chatty Cat: Chatting" }];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!params.id) {
    return redirect("/chat");
  }

  const apiClient = getApiClient(request);

  if (!apiClient) {
    throw redirect("/", 302);
  }

  const query = gql`
    query {
      user {
        id
        name
      }
    }
  `;
  const { user } = await apiClient.request<{
    user: User;
  }>(query);

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
    addMeetingParticipant: MeetingType;
  }>(mutation, { meetingId: params.id, userId: user.id });

  return { id: params.id, user, participants: meeting.users };
};

export default () => {
  const { id, user, participants } = useLoaderData<{
    id: string;
    user: User;
    participants: User[];
  }>();
  return (
    <>
      {/* todo: need a better mechanism for updating the participants, perhaps gql subscription? */}
      <ClientOnly>
        {() => <Meeting id={id} user={user} participants={participants} />}
      </ClientOnly>
    </>
  );
};
