export type DownloadProgressCallback = (loaded: number, total: number) => void;

export async function download(url: string, progressCallback?: DownloadProgressCallback): Promise<string> {
	if (self.tagMasterUserscript) {
		// Download through the userscript if it's available to bypass CSP.
		return self.tagMasterUserscript.download(url, progressCallback);
	}

	const req = await fetch(url);

	return req.text();
}
