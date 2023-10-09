import {
  redirect,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { gql } from "graphql-request";

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

export default () => {
  const {
    authenticatedUser: { name },
  } = useLoaderData<Data>();

  return (
    <div>
      <h1>Hi {name}</h1>
      <p>
        This route will be concerned with making a peer connection and
        displaying tools to manage the chat.
      </p>
    </div>
  );
};
