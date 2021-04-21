import Vue from 'vue';

import {PortHandler} from '../common/PortHandler';
import {TagDataStore} from '../common/TagDataStore';
import {SearchMethodInput, SearchMethodOutput} from '../worker/method/search';
import {download} from './method/download';
import {ClientRequestMethods, WorkerRequestMethods} from '../worker/types';

/**
 * Local tag data cache.
 */
const store = new TagDataStore();

export const tagData = store.tagData;

export const downloadProgress = Vue.observable({
	loaded: -1,
	total: -1,
});

// Workaround for loading a SharedWorker from a UserScript to bypass the strict origin policy.
function getWorker() {
	if (self.tagMasterUserscript) {
		return new SharedWorker('data:application/javascript;base64,' + btoa(self.tagMasterUserscript.GM_getResourceText('search.worker.js')));
	}

	return new SharedWorker(new URL(/* webpackChunkName: 'search.worker' */ '../worker/search.worker', import.meta.url) as unknown as string);
}

const worker = getWorker();

const handler = new PortHandler<ClientRequestMethods, WorkerRequestMethods>(worker.port, {
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

export default {
	async search(data: SearchMethodInput): Promise<SearchMethodOutput> {
		const result = await handler.send('search', data);

		store.append(result.tagData);

		return result;
	},
	async requestTagData(tags: string[]): Promise<void> {
		const data = await handler.send('requestTagData', {
			tags,
		});

		store.append(data);
	},
};
