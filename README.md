## How it works:

Load Yarn PnP and a custom `_resolveFilename` hook.  Custom hook intercepts `require('autopnp:<package name>@<package version>')` and automatically gives you the module you required by installing it into cache via yarn 2 PnP.

Installation is performed in a `worker_thread`.  Atomics are used to synchronously block while waiting for the worker to reply.

Is loaded via `NODE_OPTIONS='--require path/to/dist/require.js'`, the same trick yarn uses to install `.pnp.js`

## Main entry-point is:

- `bin/node-autopnp` put this on your path / in your shebangs to run a script with this auto-installing behavior

## State is stored here:

- `.autopnp/cache/*` each directory is a workspace with a single dependency, created automatically whenever a script tries to load a npm module.
- `.autopnp/yarn-cache` yarn 2 cache used by the workspaces of `.autopnp/cache`

## Other directories:

- `empty-pnp` an empty yarn project with an empty `.pnp.js`.  We require this `.pnp.js` to bootstrap pnp into a node process because I don't know other ways to do this.
