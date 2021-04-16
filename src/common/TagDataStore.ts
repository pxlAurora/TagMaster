import {TagData} from './types';

export class TagDataStore {
	readonly tagData: TagData = {
		tags: {},
		alias: {},
		tagGroups: {},
	};

	append(data: TagData): void {
		const {tags, alias, tagGroups} = this.tagData;

		Object.entries(data.tags).forEach(([key, value]) => {
			tags[key] = value;
		});
		Object.entries(data.alias).forEach(([key, value]) => {
			alias[key] = value;
		});
		Object.entries(data.tagGroups).forEach(([key, value]) => {
			tagGroups[key] = value;
		});
	}
}
