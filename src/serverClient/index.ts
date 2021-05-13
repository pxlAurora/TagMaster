import {TagData} from '../common/types';
import {DataSource, store, tagData} from '../dataSource';
import {download} from '../download';
import {SearchMethodOutput} from '../worker/method/search';

const URL_BASE = 'https://tagmaster.bitwolfy.com/';

export default <DataSource> {
	async requestTagData(tags) {
		tags = tags.filter((tag) => {
			const alias = tagData.alias[tag];
			const resolved = alias || tag;
			return !alias && !tagData.tags[resolved] && !tagData.tagGroups[resolved];
		});

		if (tags.length === 0) return;

		const res = await download(`${URL_BASE}requestTagData?tags=${encodeURIComponent(tags.join())}`);

		const data = JSON.parse(res) as TagData;

		store.append(data);
	},
	async search(input) {
		if (input.quick) return {
			best: [],
			other: [],
			complete: false,
		};

		const res = await download(`${URL_BASE}search?filter=${encodeURIComponent(input.filter)}`);

		const data = JSON.parse(res) as SearchMethodOutput;

		store.append(data.tagData);

		return data;
	},
};
