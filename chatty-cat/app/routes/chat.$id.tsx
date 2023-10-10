import { type MetaFunction } from "@remix-run/cloudflare";
import { LocalStream } from "~/components/chat/local-stream";

export const meta: MetaFunction = () => {
  return [{ title: "Chatty Cat: Chatting" }];
};

export default () => {
  return (
    <>
      <LocalStream />
    </>
  );
};
