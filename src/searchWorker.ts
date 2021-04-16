import {PortHandler} from './common/PortHandler';
import {TagDataStore} from './common/TagDataStore';
import {SearchMethodInput, SearchMethodOutput} from './worker/method/search';
import {WorkerRequestMethods} from './worker/types';

/**
 * Local tag data cache.
 */
const store = new TagDataStore();

export const tagData = store.tagData;

const worker = new SharedWorker(new URL(/* webpackChunkName: 'search.worker' */ './worker/search.worker', import.meta.url) as unknown as string);

const handler = new PortHandler<{}, WorkerRequestMethods>(worker.port, {});
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
