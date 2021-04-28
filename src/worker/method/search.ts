import {WorkerMethod} from '../../common/PortHandler';
import {SearchInput, SearchOutput} from '../../dataSource';
import {getTagData} from './requestTagData';
import tagData, {tagDataLoaded} from '../tagData';

export interface SearchMethodInput extends SearchInput {
}

export interface SearchMethodOutput extends SearchOutput {
}

export type SearchMethod = WorkerMethod<SearchMethodInput, SearchMethodOutput>;

function* getPopular(): Generator<string[]> {
	const popular = Object.entries(tagData.tags).filter(([, {count}]) => count > 10000).sort(([, a], [, b]) => b.count - a.count).slice(0, 500).map(([tag]) => tag);

	while (true) yield popular;
}

function* getGroups(): Generator<string[]> {
	const groups = Object.keys(tagData.tagGroups).filter((name) => !name.includes('/')).sort();

	while (true) yield groups;
}

const POPULAR = getPopular();
const GROUPS = getGroups();

export async function search({filter, quick}: SearchMethodInput): Promise<SearchMethodOutput> {
	await tagDataLoaded;

	let best: string[] = [];
	let other: string[] = [];
	let trimOther = true;
	let complete = false;

	if (filter.length === 0) {
		// nop
	} else if (filter === '@') {
		other = POPULAR.next().value;
		trimOther = false;
		complete = true;
	} else if (filter === '#') {
		other = GROUPS.next().value;
		trimOther = false;
		complete = true;
	} else if (filter[0] === '#') {
		if (filter[1] === '#') {
			// '##' is a shortcut to the index tag group.
			best = ['#index'];
			complete = true;
		} else if (filter[1] === '+') {
			// '#+' marks a sequence of tags to display as a list.
			other = filter.substr(2).split(/\s+/).filter((tag) => tag);
			complete = true;
		} else if (quick) {
			best = tagData.tagGroups[filter] ? [filter] : [];
		} else {
			const exact = tagData.tagGroups[filter];

			if (exact) {
				best = [filter];
				complete = true;
			} else {
				// The old algorithm that only searches in the first tag group. Returns much less but is much cleaner. Could probably be optimized by using a regex.
				// const found = Object.keys(tagData.tagGroups).filter((name) => name.includes(filter) && name.indexOf('/', filter.length) === -1);

				// '#/' searches in the last part of the tag group name, '#' searches in the first part.
				const regex = new RegExp(filter[1] === '/' ? `[#/][^/]*?${filter.substr(2).replace(/([^a-zA-Z0-9])/, '\\$1')}[^/]*?$` : `#[^/]*?${filter.substr(1).replace(/([^a-zA-Z0-9])/, '\\$1')}(?:$|[^/]*)`);

				const found: string[] = [];
				const related: string[] = [];
				Object.keys(tagData.tagGroups).filter((name) => regex.test(name)).forEach((tag) => {
					if (tag.startsWith('#related/')) related.push(tag);
					else found.push(tag);
				});

				best = found.length === 1 ? found : [];
				other = found.length > 1 ? found.concat(related) : related;
			}
		}
	} else if (filter[0] === '/') {
		if (!quick && filter.length > 1) {
			const regex = new RegExp(filter.substr(1));

			best = [filter.substr(1)];
			other = Object.keys(tagData.tags).filter((tag) => regex.test(tag) && tag !== filter);
		}
	} else {
		const filters = filter.split(' ').filter((filter) => !quick || filter.length > 3);

		best = filters.length > 1 ? [] : filters;
		other = (quick ? other : Object.keys(tagData.tags)).filter((tag) => filters.every((filter) => tag.includes(filter)) && !filters.includes(tag));
	}

	return {
		tagData: getTagData([...best, ...other]),
		best,
		other: trimOther ? other.slice(0, 200) : other,
		complete,
	};
}
