import Vue from 'vue';

import {PortHandler} from '../common/PortHandler';
import {download} from './method/download';
import {DataSource, store} from '../dataSource';
import {SearchMethodInput, SearchMethodOutput} from '../worker/method/search';
import {ClientRequestMethods, WorkerRequestMethods} from '../worker/types';

export const downloadProgress = Vue.observable({
	loaded: -1,
	total: -1,
});

// Workaround for loading a SharedWorker from a UserScript to bypass the strict origin policy.
function getWorker() {
	if (self.tagMasterUserscript) {
		const workerSource = self.tagMasterUserscript.GM_getResourceText('search.worker.js');

		try {
			// Try to create a SharedWorker using a URI. Works on Firefox.
			const worker = new SharedWorker('data:application/javascript;base64,' + btoa(workerSource));

			console.log('Using a SharedWorker from data URI.');

			return worker;
		} catch (ex) {
			// If the browser threw an exception due to CSP, fallback to running the worker code in the window context.
			console.log('Not using a SharedWorker.');

			const channel = new MessageChannel();
			self.tagMasterUserscript.workerFallbackPort = channel.port2;

			eval(workerSource);

			return {
				port: channel.port1,
			};
		}
	}

	const worker = new SharedWorker(new URL(/* webpackChunkName: 'search.worker' */ '../worker/search.worker', import.meta.url) as unknown as string);

	console.log('Using a SharedWorker from URL.');

	return worker;
}

let handler: PortHandler<ClientRequestMethods, WorkerRequestMethods>;

async function getHandler(): Promise<typeof handler> {
	if (handler) return handler;

	const worker = getWorker();

	handler = new PortHandler(worker.port, {
		download,
		ping() {
			return {};
		},
		tagDataStatus(data) {
			downloadProgress.loaded = data.loaded;
			downloadProgress.total = data.total;
	
			return {};
		},
	});
	handler.start();

	return handler;
}

export default <DataSource> {
	async search(data: SearchMethodInput): Promise<SearchMethodOutput> {
		const result = await (await getHandler()).send('search', data);

		store.append(result.tagData);

		return result;
	},
	async requestTagData(tags: string[]): Promise<void> {
		const data = await (await getHandler()).send('requestTagData', {
			tags,
		});

		store.append(data);
	},
};
