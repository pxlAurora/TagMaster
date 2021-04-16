/// <reference lib="webworker" />

import {PortHandler, RequestHandlerMap} from '../common/PortHandler';
import {requestTagData} from './method/requestTagData';
import {search} from './method/search';
import {tagDataLoaded} from './tagData';
import {WorkerRequestMethods} from './types';

declare var self: SharedWorkerGlobalScope & typeof globalThis;

// Webpack worker-loader types.
export default (() => null) as unknown as (() => SharedWorker);

const portHandlers: PortHandler<WorkerRequestMethods, {}>[] = [];

const requestHandlers: RequestHandlerMap<WorkerRequestMethods> = {
	search,
	requestTagData,
};

self.addEventListener('connect', (event) => {
	const port = event.ports[0];

	portHandlers.push(new PortHandler(port, requestHandlers));
});

// Delay messages until the tag data is loaded.
tagDataLoaded.then(() => {
	portHandlers.forEach((portHandler) => {
		portHandler.start();
	});
});
