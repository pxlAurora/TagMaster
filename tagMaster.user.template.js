window.document = unsafeWindow.document;
window.user_level = unsafeWindow.user_level;
window.Danbooru = unsafeWindow.Danbooru;
unsafeWindow.tagWebpackJsonp = window.tagWebpackJsonp = [];
unsafeWindow.tagMasterUserscript = window.tagMasterUserscript = {
	GM_getResourceText: function(name) {
		if (T_ASSETS[name]) {
			return GM_getResourceText(name);
		}
		throw new Error('Illegal GM_getResourceText call');
	},
	clearDownloadCache: function() {
		GM_setValue('download:data.json', false);
		GM_setValue('download-info:data.json', false);
	},
	download: function(url, progressCallback) {
		return new Promise((resolve, reject) => {
			var resolvedURL = T_ASSETS[url];
			if (!resolvedURL) return reject(new Error('Illegal download call'));

			var key = 'download:' + url;
			var cacheInfoKey = 'download-info:' + url;
			var checkedCache = false;
			var cacheInfo = GM_getValue(cacheInfoKey, false);
			var CACHE_FOR = 24 * 60 * 60 * 1000;

			if (cacheInfo && cacheInfo.date + CACHE_FOR > Date.now()) {
				return resolve(GM_getValue(key));
			}

			var req = GM_xmlhttpRequest({
				method: 'GET',
				responseType: 'text',
				url: resolvedURL,
				onprogress: function(event) {
					if (!checkedCache) {
						checkedCache = true;

						if (cacheInfo && event.finalUrl.split('?')[0] === cacheInfo.url) {
							req.abort();

							cacheInfo.date = Date.now();
							GM_setValue(cacheInfoKey, cacheInfo);

							return resolve(GM_getValue(key));
						}
					}

					progressCallback(event.loaded, event.lengthComputable ? event.total : -1);
				},
				onload: function(event) {
					GM_setValue(key, event.responseText);
					GM_setValue(cacheInfoKey, {
						date: Date.now(),
						url: event.finalUrl.split('?')[0],
					});

					resolve(event.responseText);
				},
				onerror: function(event) {
					console.log(event);
					reject();
				},
			});
		});
	},
};

GM_registerMenuCommand('Clear tag data cache', function() {
	window.tagMasterUserscript.clearDownloadCache();
});

eval(GM_getResourceText('tagMaster.js'));
