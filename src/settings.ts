import {setDataSource} from './dataSource/client';

export interface Settings {
	dataSource: 'local' | 'external';

	searchServer: string;

	searchDelay: number;

	cacheDuration: number;
}

export interface SettingsStore {
	saveSettings(settings: Settings): Promise<void>;

	loadSettings(): Promise<Settings | null>;
}

export function clone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

const DEFAULT_SETTINGS: Settings = {
	dataSource: 'local',
	searchServer: 'https://tagmaster.bitwolfy.com/',
	searchDelay: 500,
	cacheDuration: 24 * 60 * 60 * 1000,
};

export async function setSettingsStore(settingsStore: SettingsStore | null) {
	settingsHolder.settingsStore = settingsStore;

	await settingsHolder.loadSettings();
}

export class SettingsHolder {
	settingsStore: SettingsStore | null = null;

	settings: Settings | null = null;

	settingsAdjusted = false;

	getDefaultFor<K extends keyof Settings>(key: K): Settings[K] {
		return DEFAULT_SETTINGS[key];
	}

	resetToDefaults() {
		if (!this.settings) return;

		this.settings = clone(DEFAULT_SETTINGS);
	}

	getValue<K extends keyof Settings>(key: K): Settings[K] {
		return this.settings?.[key] ?? this.getDefaultFor(key);
	}

	async loadSettings(forceDefaults: boolean = false) {
		const loadedSettings = this.settingsStore && !forceDefaults ? await this.settingsStore.loadSettings() : null;

		this.settings = clone(loadedSettings ?? DEFAULT_SETTINGS);
		this.settingsAdjusted = loadedSettings !== null;

		const settings = this.settings as Record<string, any>;

		Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
			if (settings[key] !== undefined) return;

			settings[key] = value;
		});

		this.onUpdate();
	}

	async saveSettings(newSettings: Settings) {
		this.settings = clone(newSettings);
		this.settingsAdjusted = true;

		this.onUpdate();

		if (!this.settingsStore) return;
	
		await this.settingsStore.saveSettings(this.settings);
	}

	onUpdate() {
		setDataSource(({
			local: 'worker',
			external: 'server',
		} as const)[this.getValue('dataSource')]);
	}
}

export const settingsHolder = new SettingsHolder();
