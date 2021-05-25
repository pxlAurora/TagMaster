<template>
	<div class="tm-settings">
		<section class="about">
			<a href="https://github.com/pxlAurora/TagMaster">Tag Master</a> by <a href="https://github.com/pxlAurora">pxlAurora</a><br />
		</section>
		<section v-if="!settingsHolder.settingsAdjusted">
			<p>
				<strong>Looks like this is your first time!</strong> Adjust the settings below, then press the "Save" button at the bottom.
			</p>
			<p>
				You will be able to change these settings later using a button in the top right corner.
			</p>
		</section>
		<section>
			<hr />
			<h3>Data source</h3>
			<p>
				<strong>Local cache</strong> - Better privacy and faster search on high latency connections, but requires more memory.
			</p>
			<p>
				All tag data is downloaded from a server and saved on your disk. Searching is done in your browser. An update check is done at least 24 hours after the previous.
			</p>
			<p>
				Please note, <em>this works best on Firefox</em>. On Webkit based browsers, this will be slow and consume extra memory for every tab Tag Master has been opened on.
			</p>
			<p>
				<strong>External server</strong> - Searches are performed by asking a remote server. Tag data is sent with the results.
			</p>
			<div class="horizontal-field">
				<select v-model="newSettings.dataSource">
					<option value="local">Local cache</option>
					<option value="external">External server</option>
				</select>
				<a href="javascript:void 0" @click.left="resetToDefault('dataSource')" title="Reset to default">&#8635;</a>
			</div>
		</section>
		<section v-if="newSettings.dataSource === 'external'">
			<hr />
			<h3>Search server</h3>
			<p>
				Server search requests are sent to.
			</p>
			<div class="horizontal-field">
				<input type="text" v-model="newSettings.searchServer" />
				<a href="javascript:void 0" @click.left="resetToDefault('searchServer')" title="Reset to default">&#8635;</a>
			</div>
		</section>
		<section>
			<hr />
			<h3>Search delay</h3>
			<p>
				How many milliseconds (1s/1000) after a key stroke to wait before searching.
			</p>
			<div class="horizontal-field">
				<input type="text" v-model.number="newSettings.searchDelay" pattern="\d+" />
				<a href="javascript:void 0" @click.left="resetToDefault('searchDelay')" title="Reset to default">&#8635;</a>
			</div>
		</section>
		<section>
			<hr />
			<p v-if="!settingsHolder.settingsStore">
				Settings store was not set. Settings will be lost after refresh.
			</p>
			<button @click.left="cancel()" v-if="settingsHolder.settingsAdjusted">Cancel</button>
			<button @click.left="resetToDefaults()">Reset to defaults</button>
			<button @click.left="saveSettings()">Save</button>
		</section>
	</div>
</template>

<script lang="ts">
import Vue, {PropType} from 'vue';

import {clone, Settings, settingsHolder} from '../settings';

export default Vue.extend({
	data() {
		return {
			newSettings: null as Settings | null,
			settingsHolder,
		};
	},
	beforeMount() {
		this.reloadSettings();
	},
	methods: {
		reloadSettings() {
			this.newSettings = clone(settingsHolder.settings);
		},
		resetToDefault(key: keyof Settings) {
			if (!this.newSettings) return;

			(this.newSettings as Record<string, any>)[key] = settingsHolder.getDefaultFor(key);
		},
		cancel() {
			this.hide();
		},
		resetToDefaults() {
			settingsHolder.resetToDefaults();

			this.reloadSettings();
		},
		async saveSettings() {
			if (!this.newSettings) throw new Error('Settings must be loaded before saving.');
		
			await settingsHolder.saveSettings(this.newSettings);

			this.hide();
		},
		hide() {
			this.$emit('hide', true);
		},
	},
});
</script>

<style lang="stylus" scoped>
.tm-settings {
	padding: 0 8px;

	>section {
		margin: 8px 0;

		.horizontal-field {
			display: flex;

			>input, >select {
				flex-grow: 1;
			}

			>a {
				margin-left: 12px;
				font-size: 1.2em;
				overflow: hidden;
			}
		}
	}

	>.about {
		text-align: center;
	}
}
</style>
