import { json, redirect } from "@remix-run/cloudflare";
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";
import { StartChattingCard } from "~/components/chat/start-chatting-card";

import { getApiClient } from "~/lib/apiClient";

interface User {
  id: string;
  name: string;
}

type Data = { authenticatedUser: User };

export const meta: MetaFunction = () => {
  return [{ title: "Chatty Cat: Chatting" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const apiClient = getApiClient(request);

  if (!apiClient) {
    throw redirect("/", 302);
  }

  const query = gql`
    mutation UpsertUserMutation {
      upsertUser {
        id
        name
      }
    }
  `;
  const { upsertUser: authenticatedUser } = await apiClient.request<{
    upsertUser: User;
  }>(query);

  return { authenticatedUser };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const code = formData.get("code");

  if (!code?.toString().trim()) {
    return json({ errors: { code: "Code is required" } });
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
