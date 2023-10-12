import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { ClientOnly } from "remix-utils/client-only";
import { Meeting } from "~/components/chat/meeting.client";
import {
  addMeetingParticipant,
  getApiClient,
  getAuthenticatedUser,
  removeMeetingParticipant,
} from "~/lib/api";
import type { User } from "~/types";

export const meta: MetaFunction = () => {
  return [{ title: "Chatty Cat: Chatting" }];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (!params.id) {
    return redirect("/chat");
  }

  const apiClient = getApiClient(request);

  if (!apiClient) {
    throw redirect("/");
  }

  const authenticatedUser = await getAuthenticatedUser({ apiClient });
  const meeting = await addMeetingParticipant({
    apiClient,
    meetingId: params.id,
    userId: authenticatedUser.id,
  });

  return { id: params.id, authenticatedUser, participants: meeting.users };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const apiClient = getApiClient(request);
  const formData = await request.formData();
  const actionId = formData.get("actionId");
  const meetingId = formData.get("meetingId")?.toString();
  const userId = formData.get("userId")?.toString();

  if (!apiClient) {
    throw redirect("/");
  }

  if (actionId === "remove-meeting-participant" && meetingId && userId) {
    await removeMeetingParticipant({ apiClient, meetingId, userId });
  }

  return null;
};

export default () => {
  const { id, authenticatedUser, participants } = useLoaderData<{
    id: string;
    authenticatedUser: User;
    participants: User[];
  }>();
  return (
    <ClientOnly>
      {() => (
        <Meeting
          id={id}
          myUser={authenticatedUser}
          participants={participants}
        />
      )}
    </ClientOnly>
  );
};
