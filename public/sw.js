/*
 * Scramjet service worker based on the official Interstellar setup:
 * https://github.com/UseInterstellar/Interstellar/blob/main/static/sw.js
 * Interstellar is AGPL-3.0-or-later; see LICENSE-INTERSTELLAR.
 * Scramjet is AGPL-3.0-only; see LICENSE-SCRAMJET.
 */
importScripts("/assets/scramjet/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    await scramjet.loadConfig();
    if (await scramjet.route(event)) return scramjet.fetch(event);
    return fetch(event.request);
  })());
});
