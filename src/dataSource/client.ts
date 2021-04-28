import {DataSource} from '.';

export {store, tagData} from '.';

let useSource: 'server' | 'worker' = 'worker';

function forward<K extends keyof DataSource>(name: K): (...args: Parameters<DataSource[K]>) => Promise<ReturnType<DataSource[K]>> {
	return async function forwarder(...args): Promise<ReturnType<DataSource[K]>> {
		let client: DataSource;

		if (useSource === 'server') {
			client = (await import('../serverClient')).default;
		} else if (useSource === 'worker') {
			client = (await import('../workerClient')).default;
		} else {
			throw new Error('Invalid data source');
		}

		return client[name](...args);
	};
}

export function getDataSource() {
	return useSource;
}

export function setDataSource(source: typeof useSource) {
	useSource = source;
}

export default {
	requestTagData: forward('requestTagData'),
	search: forward('search'),
}
