import { json } from "@remix-run/cloudflare";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { cssBundleHref } from "@remix-run/css-bundle";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import styles from "./globals.css";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    ENV: {
      CORBADO_PROJECT_ID: string;
    };
  }
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = ({ context }: LoaderFunctionArgs) => {
  return json({ ENV: context.env as Window["ENV"] });
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
        {/* <script src="https://pro-9217300933323006574.frontendapi.corbado.io/auth.js"></script>
        <script src="https://pro-9217300933323006574.frontendapi.corbado.io/utility.js"></script> */}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
