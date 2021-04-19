import {MethodList, RequestMessage, ResponseMessage} from '../common/PortHandler';
import {RequestTagDataMethod} from './method/requestTagData';
import {SearchMethod} from './method/search';
import {UpdateTagDataMethod} from './method/updateTagData';

/**
 * List of request methods accepted by the search worker.
 */
export interface WorkerRequestMethods extends MethodList {
	search: SearchMethod;
	requestTagData: RequestTagDataMethod;
	updateTagData: UpdateTagDataMethod;
}

export type WorkerRequestMessage<M extends keyof WorkerRequestMethods | null = null> = RequestMessage<WorkerRequestMethods, M>;
export type WorkerResponseMessage<M extends keyof WorkerRequestMethods | null = null> = ResponseMessage<WorkerRequestMethods, M>;
