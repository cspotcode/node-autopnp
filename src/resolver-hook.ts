import { createRequire, Module } from 'module';
import { Worker, receiveMessageOnPort, MessageChannel, isMainThread } from 'worker_threads';
import type { InstallIntoCacheIfNeededRequest, InstallIntoCacheIfNeededResponse, WorkerData as AutoPnpWorkerData } from './worker';

interface ModuleInternal {
    _resolveFilename(request: string, parent: NodeModule, isMain: boolean, options: any): void;
}

export function installResolverHook() {
    const { port1: workerPort, port2: mainPort } = new MessageChannel();
    const sharedBuffer = new SharedArrayBuffer(8);
    const sharedBufferView = new Int32Array(sharedBuffer);
    const workerData: AutoPnpWorkerData = {
            workerPort,
            sharedBuffer,
            __IS_AUTOPNP_WORKER__: true
    };
    const workerThread = new Worker(require.resolve('./worker.js'), {
        workerData,
        transferList: [workerPort],
    });
    mainPort.start();

    // Install our resolver hook on top of PnP
    const originalModuleResolveFilename = (Module as any as ModuleInternal)._resolveFilename;
    (Module as any as ModuleInternal)._resolveFilename = _resolveFilename;

    function _resolveFilename(request: string, parent: NodeModule, isMain: boolean, options: any) {
        if (!request.startsWith('autopnp:')) {
            return originalModuleResolveFilename.call(this, request, parent, isMain, options);
        }

        const [, moduleName, version, rest] = request.match(/^autopnp:(@[^\/]+\/[^\/]+|[^@][^\/]*)@([^\/]+)(.*)/);

        const response = callToWorker({ type: 'installIntoCacheIfNeeded', moduleName, version });
        const { absoluteCacheDirectory, type } = response;
        console.dir(response);
        return createRequire(absoluteCacheDirectory).resolve(`${moduleName}${rest}`);
    }

    function callToWorker(request: InstallIntoCacheIfNeededRequest): InstallIntoCacheIfNeededResponse;
    function callToWorker(request: any): any {
        const signalBefore = Atomics.load(sharedBufferView, 0);
        mainPort.postMessage(request);
        const result = Atomics.wait(sharedBufferView, 0, signalBefore);
        const {message} = receiveMessageOnPort(mainPort);
        return message;
    }
}