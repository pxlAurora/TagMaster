import createWorker from './worker/search.worker';

const worker = createWorker();

worker.port.start();

worker.port.postMessage({});

// TODO: expose search api
