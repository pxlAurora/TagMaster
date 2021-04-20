// ==UserScript==
// @name         Tag Master
// @namespace    https://github.com/pxlAurora/
// @version      1.0.0
// @description  Tagging helper for e621.
// @author       pxlAurora
// @homepage     https://github.com/pxlAurora/TagMaster/
// @updateURL    https://github.com/pxlAurora/TagMaster/releases/latest/download/tagMaster.user.js
// @match        https://e621.net/*
// @match        https://e926.net/*
// @run-at       document-idle
// @resource     tagMaster https://github.com/pxlAurora/TagMaster/releases/latest/download/tagMaster.js
// @resource     tagMaster.lazy https://github.com/pxlAurora/TagMaster/releases/latest/download/tagMaster.lazy.js
// @resource     search.worker https://github.com/pxlAurora/TagMaster/releases/latest/download/search.worker.js
// @resource     data https://github.com/pxlAurora/e621-tag-data/releases/latest/download/data.json
// @grant        GM_getResourceText
// @grant        unsafeWindow
// ==/UserScript==

window.document = unsafeWindow.document;
window.user_level = unsafeWindow.user_level;
window.Danbooru = unsafeWindow.Danbooru;
unsafeWindow.tagWebpackJsonp = window.tagWebpackJsonp = [];
unsafeWindow.tagMasterUserscript = window.tagMasterUserscript = {
    GM_getResourceText: function(name) {
        if (['tagMaster.lazy', 'search.worker', 'data'].includes(name)) {
            return GM_getResourceText(name);
        }
        throw new Error('Illegal GM_getResourceText call');
    },
};

eval(GM_getResourceText('tagMaster'));
