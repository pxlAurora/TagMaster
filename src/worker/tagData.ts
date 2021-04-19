import {TagDataStore} from '../common/TagDataStore';

export const store = new TagDataStore();

export default store.tagData;

export const tagDataLoaded = (async () => {
	console.log('Loading tag data...');

	try {
		const req = await fetch(require('tag-data'));
		store.append(await req.json());

		console.log('Tag data loaded.');
	} catch (err) {
		console.error('Failed to load tag data:', err);
	}

	return store.tagData;
})();
