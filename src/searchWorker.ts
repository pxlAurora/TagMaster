import {PortHandler} from './common/PortHandler';
import {TagDataStore} from './common/TagDataStore';
import {SearchMethodInput, SearchMethodOutput} from './worker/method/search';
import {WorkerRequestMethods} from './worker/types';

/**
 * Local tag data cache.
 */
const store = new TagDataStore();

export const tagData = store.tagData;

// Workaround for loading a SharedWorker from a UserScript to bypass the strict origin policy.
function getWorker() {
	if (self.tagMasterUserscript) {
		return new SharedWorker('data:application/javascript;base64,' + btoa(self.tagMasterUserscript.GM_getResourceText('search.worker.js')));
	}

	return new SharedWorker(new URL(/* webpackChunkName: 'search.worker' */ './worker/search.worker', import.meta.url) as unknown as string);
}

const worker = getWorker();

const handler = new PortHandler<{}, WorkerRequestMethods>(worker.port, {});
handler.start();

if (self.tagMasterUserscript) {
	// Workaround for SharedWorker CSP restrictions.
	// FIXME: Only send data if the worker was unable to load it by itself.
	const data = self.tagMasterUserscript.GM_getResourceText('data.json');
	handler.send('updateTagData', {
		rawTagData: data,
	});
}

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
