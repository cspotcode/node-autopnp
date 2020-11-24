import { workerData, MessagePort } from 'worker_threads';
import { installIntoCacheIfNeeded } from './cache-installer';

export interface WorkerData {
    __IS_AUTOPNP_WORKER__: true;
    workerPort: MessagePort;
    sharedBuffer: SharedArrayBuffer;
}

type Request = InstallIntoCacheIfNeededRequest;
type Response = InstallIntoCacheIfNeededResponse | ErrorResponse;

export interface ErrorResponse {
    type: 'error';
    message: string;
}

export interface InstallIntoCacheIfNeededRequest {
    type: 'installIntoCacheIfNeeded';
    moduleName: string;
    version: string;
}
export interface InstallIntoCacheIfNeededResponse {
    type: 'installIntoCacheIfNeeded';
    absoluteCacheDirectory: string;
}

try {
    const { workerPort, sharedBuffer } = workerData as WorkerData;
    const sharedBufferView = new Int32Array(sharedBuffer);

    workerPort.on('message', async (message: Request) => {
        const response = await (async (): Promise<Response> => {
            try {
                switch (message.type) {
                    case 'installIntoCacheIfNeeded':
                        const { moduleName, version } = message;
                        const absoluteCacheDirectory = await installIntoCacheIfNeeded(moduleName, version);
                        return {
                            type: 'installIntoCacheIfNeeded',
                            absoluteCacheDirectory
                        } as InstallIntoCacheIfNeededResponse;
                    default:
                        throw 'unexpected request type';
                }
            } catch (e) {
                return { type: 'error', message: e?.message ?? `${e}` };
            }
        })();
        workerPort.postMessage(response);
        Atomics.add(sharedBufferView, 0, 1);
        const awokenCount = Atomics.notify(sharedBufferView, 0);
    });
} catch (e) {
    console.log(e);
}