#!/usr/bin/env bash
# Run this AFTER creating an empty repository on github.com.
#   ./push-to-github.sh https://github.com/<your-account>/<repo>.git
#
# The local git history is already initialised and committed. This script
# only adds the remote and pushes, so there is nothing for you to decide.
set -euo pipefail

cd "$(dirname "$0")"

if [ "$#" -lt 1 ]; then
  echo "Usage: ./push-to-github.sh https://github.com/<account>/<repo>.git"
  exit 1
fi

REMOTE_URL="$1"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Local repository missing. Run: git init && git add . && git commit -m 'init'"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' already exists: $(git remote get-url origin)"
  git remote set-url origin "$REMOTE_URL"
  echo "Updated to: $REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
  echo "Added origin: $REMOTE_URL"
fi

if [ -z "$(git config user.name || true)" ]; then
  echo "Git identity not configured. Set it once:"
  echo '  git config --global user.name "Qi Peng"'
  echo '  git config --global user.email "qpengking@gmail.com"'
  exit 1
fi

git branch -M main
git push -u origin main

echo
echo "Pushed. Verify at: ${REMOTE_URL%.git}"
echo "Then add the repository description on GitHub:"
echo "  Free APA 7 tools and reproducible writing workflows for doctoral researchers."
