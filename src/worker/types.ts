import {MethodList, RequestMessage, ResponseMessage, WorkerMethod} from '../common/PortHandler';

export interface SearchMethodInput {
	filter: string;
}

export interface SearchMethodOutput {
	tags: string[];
}

export type SearchMethod = WorkerMethod<SearchMethodInput, SearchMethodOutput>;

/**
 * List of request methods accepted by the search worker.
 */
export interface WorkerRequestMethods extends MethodList {
	search: SearchMethod;
};

export type WorkerRequestMessage<M extends keyof WorkerRequestMethods | null = null> = RequestMessage<WorkerRequestMethods, M>;
export type WorkerResponseMessage<M extends keyof WorkerRequestMethods | null = null> = ResponseMessage<WorkerRequestMethods, M>;
