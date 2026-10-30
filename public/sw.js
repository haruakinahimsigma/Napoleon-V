/*
 * Based on the Scramjet demo service worker:
 * https://github.com/MercuryWorkshop/scramjet/blob/main/packages/demo/public/sw.js
 * Copyright (c) Mercury Workshop. Licensed under AGPL-3.0-only.
 */
importScripts("/controller/controller.sw.js");

addEventListener("fetch", (event) => {
  if ($scramjetController.shouldRoute(event)) {
    event.respondWith($scramjetController.route(event));
  }
});
