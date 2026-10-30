# Napoleon V

A dark, minimal browser shell powered by Scramjet and Wisp.

## Run locally

Requirements: Node.js 22 or newer.

```sh
npm install
npm start
```

Open `http://localhost:3000`.

Run the automated checks with `npm test`; run syntax checks with `npm run check`.

The first startup downloads the Scramjet browser assets through `@mercuryworkshop/proxy-bootstrap`, so the server needs outbound internet access. Keep the process running: Wisp uses WebSockets.

## Deploy on Railway

1. Create a new Railway project from this repository.
2. Use the Node.js service builder.
3. Set the start command to `npm start` if Railway does not detect it automatically.
4. Deploy and open the generated public domain.

Railway supplies the `PORT` environment variable automatically.

## Health check

Visit `/health` to confirm the Node server is responding.

## Notes

- This is an experimental browser proxy. Some sites may not work, and a successful health check does not guarantee that the proxy transport is working.
- Only use this service on networks and for purposes you are authorized to use.
- Avoid putting personal credentials into a public or untrusted deployment.
