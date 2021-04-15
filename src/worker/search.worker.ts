/// <reference lib="webworker" />

import {PortHandler, RequestHandlerMap} from '../common/PortHandler';
import {WorkerRequestMethods} from './types';

declare var self: SharedWorkerGlobalScope & typeof globalThis;

// Webpack worker-loader types.
export default (() => null) as unknown as (() => SharedWorker);

const portHandlers: PortHandler<WorkerRequestMethods, {}>[] = [];

const requestHandlers: RequestHandlerMap<WorkerRequestMethods> = {
	search(data) {
		return {
			tags: [data.filter],
		};
	},
};

self.addEventListener('connect', (event) => {
	const port = event.ports[0];

	portHandlers.push(new PortHandler(port, requestHandlers));
});
