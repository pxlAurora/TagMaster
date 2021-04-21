import {MethodList, RequestMessage, ResponseMessage} from '../common/PortHandler';
import {PingMethod} from './clientMethod/ping';
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

/**
 * List of request methods sent by the search worker.
 */
export interface ClientRequestMethods extends MethodList {
	ping: PingMethod;
}
