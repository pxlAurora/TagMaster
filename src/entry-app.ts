import App from './App.vue';
import {setSettingsStore} from './settings';

const SETTINGS_KEY = 'tagmaster.settings';

setSettingsStore({
	async loadSettings() {
		const str = localStorage.getItem(SETTINGS_KEY);
		return str ? JSON.parse(str) : null;
	},
	async saveSettings(settings) {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	},
}).then(() => {
	new App({
		el: '#app',
	});
});
