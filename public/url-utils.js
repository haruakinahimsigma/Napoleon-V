const WEB_PROTOCOL = /^https?:\/\//i;
const SPECIAL_PROTOCOL = /^(?:about:|mailto:)/i;
const DOMAIN_WITH_OPTIONAL_PATH = /^(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?$/i;

export function normalizeInput(input) {
  const value = String(input ?? "").trim();
  if (!value) return null;

  if (WEB_PROTOCOL.test(value) || SPECIAL_PROTOCOL.test(value)) return value;
  if (DOMAIN_WITH_OPTIONAL_PATH.test(value)) return `https://${value}`;

  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}
