import { json } from "@remix-run/cloudflare";
import type {
  AppLoadContext,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { cssBundleHref } from "@remix-run/css-bundle";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import styles from "./globals.css";
import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/toaster";

declare global {
  interface Window {
    ENV: Pick<AppLoadContext["env"], "CORBADO_PROJECT_ID">;
  }
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = ({ context }: LoaderFunctionArgs) => {
  const { CORBADO_PROJECT_ID } = context.env as Window["ENV"];
  return json({ ENV: { CORBADO_PROJECT_ID } });
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  const [session, setSession] = useState(null);

  useEffect(() => {
    import("@corbado/webcomponent")
      .then((module) => {
        const Corbado = module.default.default || module.default || module;
        setSession(new Corbado.Session(window.ENV.CORBADO_PROJECT_ID));
      })
      .catch();
  }, []);

  useEffect(() => {
    // Refresh the session whenever it changes
    if (session) {
      // @ts-ignore
      session.refresh(() => {});
    }
  }, [session]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Outlet />
        <ScrollRestoration />
        <Toaster />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <html>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex h-full justify-center items-center flex-col gap-6">
          <div>
            <strong>WOAH.</strong> That was not meant to happen.
          </div>
          <img
            src="https://media4.giphy.com/media/xTcf1fNdmXFQ6iYgUM/giphy.gif"
            alt="Sorry about that"
            className="rounded-lg"
          />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
