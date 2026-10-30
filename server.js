import http from "node:http";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const port = Number(process.env.PORT || 3000);
const { routeRequest, routeUpgrade } = await bootstrap();
const app = express();

app.disable("x-powered-by");
app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "Napoleon V", engine: "Scramjet" });
});

app.use((req, res, next) => {
  // Serve the upstream Scramjet demo service worker from public/sw.js.
  // The bootstrap package still serves the controller, core bundle, WASM,
  // transport client, bootstrap initializer, and Wisp WebSocket route.
  if (req.path !== "/sw.js" && routeRequest(req, res)) return;
  next();
});

app.use(express.static("public", { extensions: ["html"] }));
app.get("*", (_req, res) => res.sendFile("index.html", { root: "public" }));

const server = http.createServer(app);
server.on("upgrade", (req, socket, head) => {
  if (!routeUpgrade(req, socket, head)) socket.destroy();
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Napoleon V listening on port ${port}`);
});
