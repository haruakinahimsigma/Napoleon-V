/*
 * Direct Scramjet runtime configuration, following Interstellar's public setup.
 * https://github.com/UseInterstellar/Interstellar/blob/main/static/assets/scramjet/scramjet.config.js
 * Interstellar-derived code is attributed and covered by LICENSE-INTERSTELLAR.
 */
self.__scramjet$config = {
  prefix: "/uv/scramjet/",
  codec: {
    encode: (url) => url && encodeURIComponent(url),
    decode: (url) => url && decodeURIComponent(url),
  },
  files: {
    wasm: "/assets/scramjet/scramjet.wasm.wasm",
    all: "/assets/scramjet/scramjet.all.js",
    sync: "/assets/scramjet/scramjet.sync.js",
  },
  flags: {
    rewriterLogs: false,
    scramitize: false,
    cleanErrors: true,
    sourcemaps: true,
  },
};
