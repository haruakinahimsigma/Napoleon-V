import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInput } from "../public/url-utils.js";

test("empty input returns null", () => {
  assert.equal(normalizeInput("   "), null);
});

test("keeps complete HTTP and HTTPS URLs", () => {
  assert.equal(normalizeInput("https://example.com/path?q=one"), "https://example.com/path?q=one");
  assert.equal(normalizeInput("http://example.com"), "http://example.com");
});

test("adds HTTPS to domain-like addresses", () => {
  assert.equal(normalizeInput("example.com"), "https://example.com");
  assert.equal(normalizeInput("example.com/path"), "https://example.com/path");
  assert.equal(normalizeInput("localhost.example:8080"), "https://localhost.example:8080");
});

test("converts ordinary text into a search query", () => {
  assert.equal(normalizeInput("hello world"), "https://www.google.com/search?q=hello%20world");
});

test("does not treat non-web schemes as trusted URLs", () => {
  assert.equal(normalizeInput("javascript:alert(1)"), "https://www.google.com/search?q=javascript%3Aalert(1)");
  assert.equal(normalizeInput("data:text/html,hello"), "https://www.google.com/search?q=data%3Atext%2Fhtml%2Chello");
});

test("preserves supported special URLs", () => {
  assert.equal(normalizeInput("about:blank"), "about:blank");
  assert.equal(normalizeInput("mailto:test@example.com"), "mailto:test@example.com");
});
