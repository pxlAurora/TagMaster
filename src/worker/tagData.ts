import {TagDataStore} from '../common/TagDataStore';
import {download} from './clientMethod/download';
import {broadcastTagDataStatus} from './clientMethod/tagDataStatus';

export const store = new TagDataStore();

export default store.tagData;

export const tagDataLoaded = (async () => {
	console.log('Loading tag data...');

	const data = await download('data.json', (loaded, total) => {
		broadcastTagDataStatus({
			loaded,
			total,
		});
	});

	store.append(JSON.parse(data));

	console.log('Tag data loaded.');

	broadcastTagDataStatus({
		loaded: -1,
		total: -1,
	});

	return store.tagData;
})();
