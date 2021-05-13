import {TagDataStore} from '../common/TagDataStore';

export interface SearchInput {
	filter: string;
	quick?: boolean;
}

export interface SearchOutput {
	best: string[];
	other: string[];
	complete: boolean;
}

export interface DataSource extends Record<string, (...args: any[]) => Promise<any>> {
	search(data: SearchInput): Promise<SearchOutput>;

	requestTagData(tags: string[]): Promise<void>;
}

/**
 * Local tag data cache.
 */
export const store = new TagDataStore();

export const tagData = store.tagData;
