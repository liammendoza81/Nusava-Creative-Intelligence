#!/bin/bash
# Serve the Nusava platform on http://localhost:4401
# Usage: ./serve.sh           (default port 4401)
#        ./serve.sh 8080      (custom port)
PORT="${1:-4401}"
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Serving Nusava platform from $DIR"
echo "Open http://localhost:$PORT/ in your browser. Ctrl+C to stop."
cd "$DIR" && python3 -m http.server "$PORT" --bind 127.0.0.1
