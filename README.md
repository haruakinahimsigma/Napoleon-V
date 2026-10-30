# Napoleon V

A minimal multi-tab browser shell powered directly by Scramjet, BareMux, Epoxy, and Wisp.

## Run locally

Requirements: Node.js 22 or newer.

```sh
npm install
npm start
```

Open `http://localhost:3000`.

Run the automated checks with `npm test`; run syntax checks with `npm run check`.

The server serves Scramjet, BareMux, and Epoxy assets directly from their installed npm packages. There is no `proxy-bootstrap` integration. Keep the process running: Wisp uses WebSockets.

## Deploy on Railway

1. Create a new Railway project from this repository.
2. Use the Node.js service builder.
3. Set the start command to `npm start` if Railway does not detect it automatically.
4. Deploy and open the generated public domain.

Railway supplies the `PORT` environment variable automatically.

## Browser controls

- Open a tab with the `+` button or `⌘T` / `Ctrl+T`.
- Close the current tab with `⌘W` / `Ctrl+W`.
- Focus the address bar with `⌘L` / `Ctrl+L`.
- Cycle the accent colour with the top-right button; the choice is saved locally.

The minimal layout and direct Scramjet/Wisp setup take inspiration from [Interstellar](https://github.com/UseInterstellar/Interstellar). Napoleon V does not import Interstellar's analytics or full app bundle. Interstellar-derived code is attributed and its AGPL license is included in `LICENSE-INTERSTELLAR`; Scramjet's license is in `LICENSE-SCRAMJET`.

## Health check

Visit `/health` to confirm the Node server is responding.

## Notes

- This is an experimental browser proxy. Some sites may not work, and a successful health check does not guarantee that the proxy transport is working.
- Only use this service on networks and for purposes you are authorized to use.
- Avoid putting personal credentials into a public or untrusted deployment.
