import {PortHandler} from './common/PortHandler';
import {TagData} from './common/types';
import {SearchMethodInput, SearchMethodOutput} from './worker/method/search';
import createWorker from './worker/search.worker';
import {WorkerRequestMethods} from './worker/types';

/**
 * Local tag data cache.
 */
export const tagData: TagData = {
	tags: {},
	alias: {},
	tagGroups: {},
};

function updateTagData(data: TagData) {
	Object.entries(data.tags).forEach(([key, value]) => {
		tagData.tags[key] = value;
	});
	Object.entries(data.alias).forEach(([key, value]) => {
		tagData.alias[key] = value;
	});
	Object.entries(data.tagGroups).forEach(([key, value]) => {
		tagData.tagGroups[key] = value;
	});
}

const worker = createWorker();

const handler = new PortHandler<{}, WorkerRequestMethods>(worker.port, {});

export default {
	async search(data: SearchMethodInput): Promise<SearchMethodOutput> {
		const result = await handler.send('search', data);

		updateTagData(result.tagData);

		return result;
	},
	async requestTagData(tags: string[]): Promise<void> {
		const data = await handler.send('requestTagData', {
			tags,
		});

		updateTagData(data);
	},
};
