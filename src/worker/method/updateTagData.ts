import {TagData} from '../../common/types';
import {WorkerMethod} from '../../common/PortHandler';
import {store} from '../tagData';

export interface StatusMethodInput {
	rawTagData: string;
}

export interface StatusMethodOutput {
}

export type UpdateTagDataMethod = WorkerMethod<StatusMethodInput, StatusMethodOutput>;

export function updateTagData({rawTagData}: StatusMethodInput): StatusMethodOutput {
	console.log('Received tag list from client.');

	store.append(JSON.parse(rawTagData) as TagData);

	return {};
}
