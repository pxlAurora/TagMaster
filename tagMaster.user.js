// ==UserScript==
// @name         Tag Master
// @namespace    localhost
// @version      0.1.0
// @description  Tagging helper for e621.
// @author       pxlAurora
// @match        https://e621.net/*
// @match        https://e926.net/*
// @run-at       document-idle
// @resource     tagMaster http://127.0.0.1:8080/tagMaster.js
// @resource     tagMaster.lazy http://127.0.0.1:8080/tagMaster.lazy.js
// @resource     search.worker http://127.0.0.1:8080/search.worker.js
// @resource     data http://127.0.0.1:8080/data.json
// @grant        GM_getResourceText
// @grant        unsafeWindow
// ==/UserScript==

window.document = unsafeWindow.document;
window.user_level = unsafeWindow.user_level;
window.Danbooru = unsafeWindow.Danbooru;
window.tagWebpackJsonp = [];
unsafeWindow.tagWebpackJsonp = window.tagWebpackJsonp;
unsafeWindow.tagMasterUserscript = {
    GM_getResourceText: function(name) {
        if (['search.worker', 'data'].includes(name)) {
            return GM_getResourceText(name);
        }
        throw new Error('Illegal GM_getResourceText call');
    },
};

eval(GM_getResourceText('tagMaster'));
