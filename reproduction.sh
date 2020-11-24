#!/usr/bin/env bash
set -euo pipefail

# use npm to avoid any PnP other than what autopnp installs, since that seems to have been breaking it.

# Install
rm -r .pnp.js .yarnrc.yml yarn.lock || true
npm install

# Build
./node_modules/.bin/tsc

# Put on path
export PATH="$PATH:$PWD/bin"

# Run reproduction
echo ------
node-autopnp ./examples/reproduction.js

exit $?

##############################
##############################
##############################

# alternative using yarn2

# Install
yarn

# Build
yarn tsc

# Put on path
export PATH="$PATH:$PWD/bin"

# Run reproduction
echo ------
yarn exec node-autopnp ./examples/reproduction.js
