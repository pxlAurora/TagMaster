import {PortHandler} from './common/PortHandler';
import createWorker from './worker/search.worker';
import {SearchMethodOutput, WorkerRequestMethods} from './worker/types';

const worker = createWorker();

const handler = new PortHandler<{}, WorkerRequestMethods>(worker.port, {});

export function search(filter: string): Promise<SearchMethodOutput> {
	return handler.send('search', {
		filter,
	});
}
