import http from "node:http";
import { createRequire } from "node:module";
import express from "express";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const require = createRequire(import.meta.url);
const port = Number(process.env.PORT || 3000);
const app = express();

const { scramjetPath } = require("@mercuryworkshop/scramjet/path");
const { epoxyPath } = require("@mercuryworkshop/epoxy-transport");
const { baremuxPath } = require("@mercuryworkshop/bare-mux/node");

app.disable("x-powered-by");

const staticOptions = {
  setHeaders(res, filePath) {
    if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
      res.type("text/javascript");
      res.setHeader("Service-Worker-Allowed", "/");
    } else if (filePath.endsWith(".wasm")) {
      res.type("application/wasm");
    }
  },
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "Napoleon V", engine: "Scramjet", integration: "direct" });
});

// Serve Scramjet, BareMux, and Epoxy directly from their installed packages.
// No proxy-bootstrap package or generated bootstrap endpoint is used.
app.use("/assets/scramjet/", express.static(scramjetPath, staticOptions));
app.use("/baremux/", express.static(baremuxPath, staticOptions));
app.use("/epoxy/", express.static(epoxyPath, staticOptions));
app.use(express.static("public", { ...staticOptions, extensions: ["html"] }));
app.get("*", (_req, res) => res.sendFile("index.html", { root: "public" }));

const server = http.createServer(app);
server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
    return;
  }
  socket.destroy();
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Napoleon V direct Scramjet server listening on port ${port}`);
});
