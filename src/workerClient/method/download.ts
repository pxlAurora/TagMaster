import {PortHandler} from '../../common/PortHandler';
import {download as doDownload} from '../../download';
import {DownloadMethodInput, DownloadMethodOutput, DownloadStatusMethod} from '../../worker/clientMethod/download';

export async function download(data: DownloadMethodInput, portHandler: PortHandler<{}, {downloadStatus: DownloadStatusMethod;}>): Promise<DownloadMethodOutput> {
	let resolvedURL: string | undefined = data.url;

	if (!self.tagMasterUserscript) {
		// Resolve the URL ourselves if the download isn't handled by the userscript functions.
		resolvedURL = {
			'data.json': new URL('tag-data', import.meta.url).toString(),
		}[resolvedURL];
	}

	if (!resolvedURL) throw new Error('Invalid download request');

	const res = await doDownload(resolvedURL, (loaded, total) => {
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
