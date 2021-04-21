window.document = unsafeWindow.document;
window.user_level = unsafeWindow.user_level;
window.Danbooru = unsafeWindow.Danbooru;
unsafeWindow.tagWebpackJsonp = window.tagWebpackJsonp = [];
unsafeWindow.tagMasterUserscript = window.tagMasterUserscript = {
	GM_getResourceText: function(name) {
		if (T_CHUNKS.includes(name)) {
			return GM_getResourceText(name);
		}
		throw new Error('Illegal GM_getResourceText call');
	},
};

eval(GM_getResourceText('tagMaster.js'));
