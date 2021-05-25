import {SettingsStore} from './settings';

declare global {
	interface TagMasterUserscript {
		workerFallbackPort?: MessagePort;

		GM_getResourceText(name: string): string;

		download(url: string, progressCallback?: (loaded: number, total: number) => void): Promise<string>;

		settingsStore: SettingsStore;
	}

	interface Window {
		tagMasterUserscript?: TagMasterUserscript;
	}

	interface SharedWorkerGlobalScope {
		tagMasterUserscript?: TagMasterUserscript;
	}
}
