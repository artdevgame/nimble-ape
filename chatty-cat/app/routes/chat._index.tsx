import { json, redirect } from "@remix-run/cloudflare";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { StartChattingCard } from "~/components/chat/start-chatting-card";

import { createMeeting, getApiClient, getAuthenticatedUser } from "~/lib/api";
import type { User } from "~/types";

type Data = { authenticatedUser: User };

export const meta: MetaFunction = () => {
  return [{ title: "Chatty Cat: Chatting" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const apiClient = getApiClient(request);

  if (!apiClient) {
    throw redirect("/");
  }

  return { authenticatedUser: getAuthenticatedUser({ apiClient }) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const apiClient = getApiClient(request);
  const formData = await request.formData();
  const actionId = formData.get("actionId");
  const code = formData.get("code");

  if (!apiClient) {
    throw redirect("/");
  }

  if (actionId === "new-meeting") {
    const meeting = await createMeeting({ apiClient });
    return redirect(`/chat/${meeting.id}`);
  }

  if (!code?.toString().trim()) {
    return json({ actionId, errors: { code: "Code is required" } });
  }

  return redirect(`/chat/${code}`);
};

export default () => {
  const {
    authenticatedUser: { name },
  } = useLoaderData<Data>();

  return (
    <div className="flex items-center justify-center h-full">
      <StartChattingCard name={name} />
    </div>
  );
};
