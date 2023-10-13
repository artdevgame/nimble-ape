# 😸 Chatty Cat

`chatty-cat` is a peer to peer video call software developed as a solution to a tech challenge set by [Nimble Ape](https://nimblea.pe).

https://github.com/artdevgame/nimble-ape/assets/353729/f59beeca-d0b6-4f4f-9bcf-6bdee941b0f3

## How to use the project

I've deployed a working demo here: https://chatty-cat.mikeholloway.co.uk/

If it's your first time, you'll need to sign up first. If you have a device with a fingerprint scanner, you should be able to use that to login on subsequent visits. Alternatively, you will be sent a magic link via your email.

Once authenticated, create a **New meeting** and send your friend the code (the UUID from the url, looks like: `09968f21-c138-4b9a-9042-4ff349d78625`). Alternatively, use an existing code and press the **Join** button.

There's not much to do inside, press the video button to start broadcasting your camera. When a friend joins, you will see their broadcast.

To see how much latency there is on the call, load [GoPro's Precision Date and Time **(Local)**](https://gopro.github.io/labs/control/precisiontime/) tool on your phone and hold the QR code up to your camera. A little popup should appear by your face in the window with a `ms` value. (Chrome only)

## How to install and run the project

> Please see [known issues](#-known-issues--limitations)

1. Create a new [Corbado project](https://app.corbado.com/) for local dev
   1. Application URL: http://localhost:8788
   2. Redirect URL: http://localhost:8788/chat
   3. Relying Party: `localhost`
2. Add required environment variables for the app
   1. `cd chatty-cat`
   2. Add the following vars to `.dev.vars`:
      1. `CORBADO_PROJECT_ID=pro-[id]` (from step 1)
      2. `GRAPHQL_ENDPOINT=http://127.0.0.1:8787`
3. Install app dependencies: `npm install`
4. Install api dependencies
   1. `cd ../chatty-cat-api`
   2. `npm install`
5. [Create a D1 database](https://developers.cloudflare.com/d1/get-started/#2-create-a-database) to hold app data
   1. `wrangler d1 create chatty-cat`
   2. Update `wrangler.toml` to use your D1 config
6. Create the tables and indexes
   1. `wrangler d1 execute chatty-cat --file=./seed.sqlite --local`
7. Navigate to the root of the project and run `npm install && npm run dev`
8. Visit http://localhost:8788 to view the site **(Corbado might not work if you use the IP, keep this in mind if you see sign up errors too)**

## Appendix

### 📋 Project requirements

- Create an app that allows for two way video (PeerJS) stored on CloudFlare Pages
- Analysis on video received, persisted to CloudFlare D1 via an API running on a CloudFlare Worker
- Users must authenticate

> I have purposely avoid the requirement to _persist analysis of video in D1_ given that the frame analysis code executes continuously and frequently. I believe the underlying requirement of reading/writing to the database from a Worker is the challenge, which is accomplished with the GraphQL API, rather than when and what is written.

### 🤖 Technology used

The following are notable technologies in the project:

- [Cloudflare Pages](https://developers.cloudflare.com/pages/) - Hosting for the app
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Serverless layer to host the API
- [D1](https://developers.cloudflare.com/d1/) - Serverless SQL database to store users and meeting information
- [graphql-yoga](https://github.com/dotansimha/graphql-yoga) - GraphQL server (API)
- [@pothos](https://pothos-graphql.dev/) - Type safety for GraphQL
- [Remix](https://remix.run/) - Full stack web framework
- [React](https://react.dev/) - UI library
- [Tailwind](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Corbado](https://www.corbado.com/) - Passwordless / Passkey authentication

### 🧠 Learnings, considerations & challenges

#### Architecture

- I'm not familiar with all of the details of Cloudflare, so I may have made some mistakes with the architecture I chose.
- Cloudflare Pages has a directory called `functions` for Worker-related files. I could have used this for the GraphQL API, but instead I created a mono-repo structure. This is usually a good choice for separating the API from the app, but [NX isn't supported](https://github.com/cloudflare/next-on-pages/issues/65#issuecomment-1438607957) on Cloudflare Pages (1: https://developers.cloudflare.com/pages/platform/known-issues/#builds-and-deployment). I didn't put time into automating the deployments with a single command, but this isn't a major issue.
- I don't think Pages supports wrangler.toml vars (2: https://github.com/cloudflare/workers-sdk/issues/898#issuecomment-1125255171), so I've added them as environment variables manually. Locally, I use `.dev.vars`.

#### Frontend framework

- I enjoy working with Next.js and Remix, so I used them for the frontend. This project doesn't really need a framework, but I used it as an opportunity to build on my Remix knowledge.
- There isn't a good working HMR solution for Remix, so the developer experience suffers a little. I found a workaround using the `live-reload` param of wrangler.

#### GraphQL server

- The official docs for using GraphQL on Cloudflare Workers point to a deprecated package, `apollo-server-cloudflare`. I tried using another template (3: https://github.com/kimyvgy/worker-apollo-server-template/tree/main), but I struggled to get Apollo working without issue.
- I learned that `miniflare` has been merged into `wrangler dev`, but the README doesn't mention this. I was confused about how to start up the GraphQL server, but I found the solution in the migration guide (4: https://miniflare.dev/get-started/migrating#cli-changes).
- When I added D1, the server started throwing an error because of service-worker / module-worker changes. This became a blocking issue, so I looked for a non-Apollo solution.
- In the end, I adopted `graphql-yoga`.

#### Authentication

- I used Corbado for authentication. I talked to the creator of Corbado about customisation, but it's pretty limited right now. They're creating a sign-up form builder and React-specific versions in the future, but I couldn't provide my own input & label components for the forms.
- The authentication experience is a bit janky, but it's an area that could be improved with time.

#### User disconnection

- I store the user IDs in the database so that new peers know who to call when they join a meeting. If a user reloads the page or stops & starts their video stream, this handshake is repeated.
- When a peer presses the disconnect button, they are removed from the database, but the other peers won't know this until they refresh the page. They will continue to try and call the disconnected peer. This problem is amplified if one peer closes the tab rather than pressing the button, because they won't be removed from the database. Even if the remaining peer reloads their page, they will still attempt to call the non-existent peer.
- I could mitigate this issue with more time by using SSE, PubSub, or GraphQL subscriptions to update other peers when a user is removed from the database. Alternatively, I could create a data channel with PeerJS and send a message before closing the connection and have each peer update their own internal reference of users.

#### Other

- I don't clean up any empty meetings (ones without any participants). This isn't really an issue for this tech challenge, but if it were, I would use a cron job or scheduled function to handle it.
- My commit messages follow the Conventional Commits: https://www.conventionalcommits.org/ specification.
- I haven't added tests due to time constraints 🙀 but I would add some [unit tests](https://jestjs.io/) in the GraphQL layer and if complexity grew in the user flows of the frontend, I would add [E2E tests](https://www.cypress.io/) to give me confidence there. I would consider writing unit tests to cover the latency calculation.

### 🐛 Known issues & limitations

> These are issues I'm confident that I could resolve given more time

- I'm unsure if I'm cleaning up the MediaStream from the trackGenerator properly, disabling the camera causes an error to be thrown in the console and the connection can be held open even when the disable video button is pressed.
- The points raised in `User disconnection` above can be problematic if two people have joined and not cleanly exited. If there's a problem getting into the room, it might be easier to create a new one for now.
- I've hardcapped each meeting room to 2 people. You can't join a meeting room using the same id (techically, you can join but things won't work as expected). If you want to run a test locally, sign up with 2 different accounts so they each have a unique user id.
