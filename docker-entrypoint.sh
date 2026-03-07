#!/bin/sh
set -eu

escape_js() {
  printf '%s' "${1:-}" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

GEMINI_KEY_ESCAPED="$(escape_js "${VITE_GEMINI_API_KEY:-}")"
SHEETS_KEY_ESCAPED="$(escape_js "${VITE_GOOGLE_SHEETS_API_KEY:-}")"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  VITE_GEMINI_API_KEY: "${GEMINI_KEY_ESCAPED}",
  VITE_GOOGLE_SHEETS_API_KEY: "${SHEETS_KEY_ESCAPED}"
};
EOF

exec nginx -g 'daemon off;'
