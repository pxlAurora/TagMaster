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
	download: async function(url, progressCallback) {
		// This code is responsible only for caching webpack assets. Caching other requests is handled by the browser.
		var cacheable = T_ASSETS[url] !== undefined;
		var resolvedURL = T_ASSETS[url] || url;
		if (!resolvedURL) return Promise.reject(new Error('Illegal download call'));

		var key = 'download:' + url;
		var cacheInfoKey = 'download-info:' + url;
		var checkedCache = false;
		var cacheInfo = cacheable ? GM_getValue(cacheInfoKey, false) : false;
		var cacheFor = (await window.tagMasterUserscript.settingsStore.loadSettings()).cacheDuration;
		if (cacheInfo && cacheInfo.date + cacheFor > Date.now()) {
			return Promise.resolve(GM_getValue(key));
		}

		return new Promise((resolve, reject) => {
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

					if (progressCallback) {
						progressCallback(event.loaded, event.lengthComputable ? event.total : -1);
					}
				},
				onload: function(event) {
					if (cacheable) {
						GM_setValue(key, event.responseText);
						GM_setValue(cacheInfoKey, {
							date: Date.now(),
							url: event.finalUrl.split('?')[0],
						});
					}

					resolve(event.responseText);
				},
				onerror: function(event) {
					console.log(event);
					reject();
				},
			});
		});
	},
	settingsStore: {
		loadSettings: function() {
			var loadedSettings = GM_getValue('settings') || null;

			return Promise.resolve(loadedSettings);
		},
		saveSettings: function(settings) {
			GM_setValue('settings', settings);

			return Promise.resolve();
		},
	},
};

GM_registerMenuCommand('Clear tag data cache', function() {
	window.tagMasterUserscript.clearDownloadCache();
});

eval(GM_getResourceText('tagMaster.js'));
