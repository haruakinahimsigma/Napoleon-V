// BareMux 2.x publishes a classic browser bundle, not an ES module.
// index.html loads that bundle first; expose its global through the import API
// expected by the engine initializer.
const BareMux = globalThis.BareMux;

if (!BareMux?.BareMuxConnection) {
  throw new Error("BareMux failed to load from /baremux/index.js");
}

export const BareMuxConnection = BareMux.BareMuxConnection;
