#!/bin/sh
set -e

if [ -f config/config.json ]; then
  echo "Using existing config/config.json"
else
  echo "Creating config/config.json from defaults"
  cp config.default.json config/config.json
fi

yarn run build

exec pm2-runtime start ecosystem.config.js
