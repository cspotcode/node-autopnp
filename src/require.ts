import {workerData, isMainThread} from 'worker_threads';
import type {WorkerData} from './worker';
import type * as resolverHook from './resolver-hook';

if(isMainThread) {
    // TODO how to install into worker threads, too?

    // Install PnP
    const emptyPnp = require('../empty-pnp/.pnp.js');
    emptyPnp.setup();

    // Install our autopnp: resolver hook
    const { installResolverHook } = require('./resolver-hook') as typeof resolverHook;
    installResolverHook();
}