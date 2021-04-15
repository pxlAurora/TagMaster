import {TagData} from '../../common/types';
import {WorkerMethod} from '../../common/PortHandler';
import tagData from '../tagData';

export interface RequestTagDataMethodInput {
	tags: string[];
}

export interface RequestTagDataMethodOutput extends TagData {
}

export type RequestTagDataMethod = WorkerMethod<RequestTagDataMethodInput, RequestTagDataMethodOutput>;

export function getTagData(tags: string[]): TagData {
	const data: TagData = {
		tags: {},
		alias: {},
		tagGroups: {},
	};

	tags.forEach((tag) => {
		data.tags[tag] = tagData.tags[tag];
		data.tagGroups[tag] = tagData.tagGroups[tag];

		const alias = tagData.alias[tag];
		if (alias) {
			data.alias[tag] = alias;
			data.tags[alias] = tagData.tags[alias];
			data.tagGroups[alias] = tagData.tagGroups[alias];
		}
	});

	return data;
}

export function requestTagData({tags}: RequestTagDataMethodInput): RequestTagDataMethodOutput {
	return getTagData(tags);
}
