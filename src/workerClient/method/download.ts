import {PortHandler} from '../../common/PortHandler';
import {DownloadMethodInput, DownloadMethodOutput, DownloadStatusMethod} from '../../worker/clientMethod/download';

export async function download(data: DownloadMethodInput, portHandler: PortHandler<{}, {downloadStatus: DownloadStatusMethod;}>): Promise<DownloadMethodOutput> {
	if (self.tagMasterUserscript) {
		const res = await self.tagMasterUserscript.download(data.url, (loaded, total) => {
			portHandler.send('downloadStatus', {
				jobId: data.jobId,
				loaded,
				total,
			});
		});

		return {
			data: res,
		};
	}

	const resolvedURL = {
		'data.json': new URL('tag-data', import.meta.url).toString(),
	}[data.url];

	if (!resolvedURL) throw new Error('Invalid download request');

	const req = await fetch(resolvedURL);

	return {
		data: await req.text(),
	};
}
