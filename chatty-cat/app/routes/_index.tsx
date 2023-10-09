import type { MetaFunction } from "@remix-run/cloudflare";
import { ClientOnly } from "remix-utils/client-only";
import { Auth } from "~/components/welcome/auth";

export const meta: MetaFunction = () => {
  return [{ title: "Chatty Cat" }];
};

export default () => {
  return (
    <div className="h-full flex items-center justify-center">
      <ClientOnly>{() => <Auth />}</ClientOnly>
    </div>
  );
};
