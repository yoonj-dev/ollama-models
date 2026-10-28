#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=== Ollama Models Studio ==="
echo "Node: $(node -v)"
echo "Host: http://localhost:3400"
echo "Opening browser in 2 seconds..."

(sleep 2 && open "http://localhost:3400") &
npm run dev
