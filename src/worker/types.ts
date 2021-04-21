import {MethodList, RequestMessage, ResponseMessage} from '../common/PortHandler';
import {DownloadMethod, DownloadStatusMethod} from './clientMethod/download';
import {PingMethod} from './clientMethod/ping';
import {TagDataStatusMethod} from './clientMethod/tagDataStatus';
import {RequestTagDataMethod} from './method/requestTagData';
import {SearchMethod} from './method/search';

/**
 * List of request methods accepted by the search worker.
 */
export interface WorkerRequestMethods extends MethodList {
	downloadStatus: DownloadStatusMethod;
	search: SearchMethod;
	requestTagData: RequestTagDataMethod;
}

export type WorkerRequestMessage<M extends keyof WorkerRequestMethods | null = null> = RequestMessage<WorkerRequestMethods, M>;
export type WorkerResponseMessage<M extends keyof WorkerRequestMethods | null = null> = ResponseMessage<WorkerRequestMethods, M>;

/**
 * List of request methods sent by the search worker.
 */
export interface ClientRequestMethods extends MethodList {
	download: DownloadMethod;
	ping: PingMethod;
	tagDataStatus: TagDataStatusMethod;
}
