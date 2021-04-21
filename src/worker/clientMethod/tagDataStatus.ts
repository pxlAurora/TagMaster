import {WorkerMethod} from '../../common/PortHandler';
import {portHandlers} from '../search.worker';

export interface TagDataStatusMethodInput {
	loaded: number;
	total: number;
}

export type TagDataStatusMethod = WorkerMethod<TagDataStatusMethodInput, {}>;

export function broadcastTagDataStatus(status: TagDataStatusMethodInput): void {
	portHandlers.forEach((portHandler) => {
		portHandler.send('tagDataStatus', status);
	});
}
