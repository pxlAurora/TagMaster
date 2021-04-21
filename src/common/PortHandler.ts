/**
 * Definition of a single worker method, including the data it expects to be sent with the request (input), and the data it responds with (output).
 */
export interface WorkerMethod<I, O> {
	input: I;
	output: O;
}

/**
 * List of methods a side supports.
 */
export type MethodList = Record<string, WorkerMethod<any, any>>;

/**
 * All possible worker messages or a subset of them (`S` to pick side, `M` to pick methods).
 */
export interface WorkerMessage<L extends MethodList, S extends 'input' | 'output' = 'input' | 'output', M extends keyof L | null = null, M2 extends keyof L = M extends null ? keyof L : M> {
	method: S extends 'input' ? M2 : undefined;
	nonce: string;
	data: L[M2][S];
}

/**
 * All possible request messages of a side, or a subset of them (`M`).
 */
export type RequestMessage<L extends MethodList, M extends keyof L | null = null> = WorkerMessage<L, 'input', M>;

/**
 * All possible response messages of a side, or a subset of them (`M`).
 */
export type ResponseMessage<L extends MethodList, M extends keyof L | null = null> = WorkerMessage<L, 'output', M>;

export type RequestHandlerMap<L extends MethodList> = {
	[method in keyof L]?: (data: RequestMessage<L, method>['data']) => ResponseMessage<L, method>['data'] | Promise<ResponseMessage<L, method>['data']>;
};

function nextNonce() {
	return Math.floor(Math.random() * 0xffffff).toString(36);
}

function isResponse<Us extends MethodList, Them extends MethodList>(msg: RequestMessage<Us> | ResponseMessage<Them>): msg is ResponseMessage<Them> {
	return msg.method === undefined;
}

/**
 * Generic handler for bi-directional communication over a `MessagePort`.
 *
 * `Us` describes the list of methods this side can handle, `Them` describes the other side.
 */
export class PortHandler<Us extends MethodList, Them extends MethodList> {
	port: MessagePort;

	requestHandlers: RequestHandlerMap<Us> = {};

	responseHandlers: Map<string, (data: ResponseMessage<Them>['data']) => void> = new Map();

	onClosed: Promise<void>;
	isClosed = false;
	private callOnClosed!: () => void;

	constructor(port: MessagePort, requestHandlers: RequestHandlerMap<Us>) {
		this.port = port;
		this.requestHandlers = requestHandlers;

		this.onClosed = new Promise((resolve) => {
			this.callOnClosed = resolve;
		});

		this.port.addEventListener('message', this.onMessage.bind(this));
	}

	start() {
		this.port.start();
	}

	close() {
		this.isClosed = true;

		this.port.close();

		this.callOnClosed();
	}

	async onMessage(event: MessageEvent<RequestMessage<Us> | ResponseMessage<Them>>): Promise<void> {
		const msg = event.data;
		const nonce = msg.nonce;

		if (isResponse<Us, Them>(msg)) {
			const handler = this.responseHandlers.get(nonce);
			if (!handler) return;
	
			this.responseHandlers.delete(nonce);
	
			handler(msg.data);

			return;
		}

		const handler = this.requestHandlers[msg.method];
		if (!handler) return;

		const response = await handler(msg.data);

		this.port.postMessage(<ResponseMessage<Us, (typeof msg)['method']>> {
			nonce,
			data: response,
		});
	}

	send<K extends keyof Them>(method: K, data: Them[K]['input']): Promise<Them[K]['output']> {
		return new Promise((resolve) => {
			const nonce = nextNonce();
		
			this.responseHandlers.set(nonce, resolve);
		
			this.port.postMessage(<RequestMessage<Them, K>> {
				method,
				nonce,
				data,
			});
		});
	}
}
