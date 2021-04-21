/// <reference lib="webworker" />

import {PortHandler, RequestHandlerMap} from '../common/PortHandler';
import {downloadStatus, reassignDownloadJobs} from './clientMethod/download';
import {ping} from './clientMethod/ping';
import {requestTagData} from './method/requestTagData';
import {search} from './method/search';
import {ClientRequestMethods, WorkerRequestMethods} from './types';

declare var self: SharedWorkerGlobalScope & typeof globalThis;

export const portHandlers: PortHandler<WorkerRequestMethods, ClientRequestMethods>[] = [];

const requestHandlers: RequestHandlerMap<WorkerRequestMethods> = {
	downloadStatus,
	search,
	requestTagData,
};

self.addEventListener('connect', (event) => {
	const port = event.ports[0];
	const portHandler = new PortHandler<{}, ClientRequestMethods>(port, requestHandlers);

	portHandler.onClosed.then(() => {
		const index = portHandlers.indexOf(portHandler);
		if (index !== -1) portHandlers.splice(index, 1);

		reassignDownloadJobs();
	});

	portHandlers.push(portHandler);

	port.start();
});

const PING_INTERVAL = 10000;

setInterval(() => {
	portHandlers.forEach((portHandler) => {
		ping(portHandler, 2000);
	});
}, PING_INTERVAL);
