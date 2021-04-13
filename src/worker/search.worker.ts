/// <reference lib="webworker" />

declare var self: SharedWorkerGlobalScope & typeof globalThis;

// Webpack worker-loader types.
export default (() => null) as unknown as (() => SharedWorker);

function attachToPort(port: MessagePort) {
	port.addEventListener('message', (msg) => {
		// TODO: implement search methods
		console.log(msg);
	});
}

self.addEventListener('connect', (event) => {
	const port = event.ports[0];

	attachToPort(port);
});
