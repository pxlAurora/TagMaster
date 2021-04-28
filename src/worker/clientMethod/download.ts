import {PortHandler, WorkerMethod} from '../../common/PortHandler';
import {DownloadProgressCallback} from '../../download';
import {portHandlers} from '../search.worker';

export interface DownloadMethodInput {
	jobId: number;
	url: string;
}

export interface DownloadMethodOutput {
	data: string;
}

export type DownloadMethod = WorkerMethod<DownloadMethodInput, DownloadMethodOutput>;

export interface DownloadStatusMethodInput {
	jobId: number;
	loaded: number;
	total: number;
}

export interface DownloadStatusMethodOutput {
}

export type DownloadStatusMethod = WorkerMethod<DownloadStatusMethodInput, DownloadStatusMethodOutput>;

export interface DownloadJob {
	id: number;
	url: string;
	portHandler: DownloadPortHandler | null;
	progressCallback?: DownloadProgressCallback,
	resolve: (data: string) => void;
}

export type DownloadPortHandler = PortHandler<{downloadStatus: DownloadStatusMethod;}, {download: DownloadMethod;}>;

const jobs = new Map<number, DownloadJob>();
let nextJobId = 0;

export function reassignDownloadJobs() {
	jobs.forEach(async (job) => {
		if (job.portHandler && !job.portHandler.isClosed) return;

		if (!portHandlers || portHandlers.length === 0) {
			setTimeout(() => reassignDownloadJobs(), 1000);
			return;
		}

		const portHandler = portHandlers[0];
		job.portHandler = portHandler;

		const response = await portHandler.send('download', {
			jobId: job.id,
			url: job.url,
		});

		job.resolve(response.data);

		jobs.delete(job.id);
	});
}

export function download(url: string, progressCallback?: DownloadProgressCallback): Promise<string> {
	return new Promise((resolve) => {
		const jobId = nextJobId++;
		const job: DownloadJob = {
			id: jobId,
			url,
			portHandler: null,
			progressCallback,
			resolve,
		};

		jobs.set(jobId, job);

		reassignDownloadJobs();
	});
}

export function downloadStatus(data: DownloadStatusMethodInput): DownloadStatusMethodOutput {
	const job = jobs.get(data.jobId);

	if (job) {
		job.progressCallback?.(data.loaded, data.total);
	}

	return {};
}
