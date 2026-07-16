#!/usr/bin/env bash
set -euo pipefail
cd /home/team/shared/site
export PRISM_DB_URL="$TEAM_DB_URL"
export PRISM_DB_AUTH_TOKEN="$TEAM_DB_AUTH_TOKEN"
bun run publish 2>&1 | tee /tmp/publish-run.txt