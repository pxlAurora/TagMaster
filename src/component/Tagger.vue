<template>
	<floating-container :tag="'blockquote'" class="tagger" v-show="visible" :floating="floating" v-slot="{dragging, onMouseDown}">
		<div class="sticky">
			<h5 class="title" @mousedown.left="onMouseDown">Tag Master</h5>
			<input class="search" type="text" v-model="searchedTag" @keypress.enter="doSearch" title="Search for tags. Spaces are used to create AND filters. Start with / to use RegEx. # for tag groups. @ for list of top 500 popular tags." />
		</div>
		<div v-if="dataLoaded" v-show="!dragging">
			<tag v-for="(t, index) in shownTags" :key="t" :tagName="t" :expandUntil="index < foundImmediateTags.length ? 0 : -1" :tagList="tagList" :lockedTagList="lockedTagList" />
		</div>
		<div v-else class="info">
			({{ loadingText }})
		</div>
		<div v-if="searching" class="info">
			(searching)
		</div>
	</floating-container>
</template>

<script lang="ts">
import Vue from 'vue';

import {TagData, TagType} from '../common/types';
import dataSource, {tagData} from '../dataSource/client';
import FloatingContainer from './FloatingContainer.vue';
import Tag from './Tag.vue';
import {TagList} from '../TagList';
import {downloadProgress} from '../workerClient';

const HISTORY_KEY = 'tags.history';
const UNLOAD_CONFIRM = () => confirm('Do you really want to leave? You might lose unsaved changes.');

const TAG_TYPE_ORDER = [TagType.ARTIST, TagType.CHARACTER, TagType.COPYRIGHT, TagType.SPECIES, TagType.GENERAL, TagType.META, TagType.LORE];

// I kind of don't like how many special cases related tags require. Can something be done about this?

export default Vue.extend({
	components: {
		FloatingContainer,
		Tag,
	},
	model: {
		prop: 'tagList',
	},
	props: {
		id: {
			type: String,
			default: '$default',
		},
		tagList: {
			type: TagList,
			default: () => new TagList(),
		},
		lockedTagList: {
			type: TagList,
			default: () => new TagList(),
		},
		visible: {
			type: Boolean,
			default: true,
		},
		floating: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			searchedTag: '',
			foundImmediateTags: [] as string[],
			foundTags: [] as string[],
			dataLoaded: false,
			searching: false,
			searchTimeout: -1,
			oldBeforeUnloadHandler: null as typeof window['onbeforeunload'],
			downloadProgress,
		};
	},
	computed: {
		shownTags(): string[] {
			if (this.searchedTag) {
				return this.foundImmediateTags.concat(this.foundTags);
			} else {
				return this.sortedTagList;
			}
		},
		sortedTagList(): string[] {
			return Object.keys(this.tagList.tags).sort((a, b) => {
				const typeA = tagData.tags[a]?.type;
				const typeB = tagData.tags[b]?.type;
				if (typeA !== typeB) return TAG_TYPE_ORDER.slice(0, TAG_TYPE_ORDER.indexOf(typeA)).includes(typeB) ? 1 : -1;

				return a.localeCompare(b);
			});
		},
		loadingText(): string {
			const out = ['loading'] as string[];

			if (this.downloadProgress.loaded > 0) {
				out.push(this.downloadProgress.total > 0 ? `${Math.floor(this.downloadProgress.loaded / this.downloadProgress.total * 1000) / 10}%` : `${this.downloadProgress.loaded / 1000000} MB`);
			}

			return out.join(', ');
		},
	},
	watch: {
		tagList: {
			deep: true,
			handler(to: TagList, from: TagList) {
				this.emitInput();
				this.saveTags();

				// Request new tag data when provided with a new tag list.
				if (to !== from) {
					this.requestTagData();
				}
			},
		},
		searchedTag() {
			clearTimeout(this.searchTimeout);

			this.doSearch(true);
			this.searchTimeout = window.setTimeout(() => this.doSearch(false), 500);
		},
	},
	created() {
		if (this.tagList.size() === 0) {
			const initial = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')[this.id]?.tags;

			if (initial) {
				const list = new TagList();
				list.tags = initial;

				if (list.size() > 0) {
					this.$set(this.tagList, 'tags', initial);
					this.emitInput();
					this.requestTagData();
				}
			}
		}

		this.requestTagData();
	},
	mounted() {
		// Technically not great but whatever, good enough. Let's just hope nothing else interacts with it. addEventListener doesn't work for this.
		if (window.onbeforeunload !== UNLOAD_CONFIRM) this.oldBeforeUnloadHandler = window.onbeforeunload;
		window.onbeforeunload = UNLOAD_CONFIRM;
	},
	beforeDestroy() {
		if (window.onbeforeunload === UNLOAD_CONFIRM) window.onbeforeunload = this.oldBeforeUnloadHandler;
	},
	methods: {
		emitInput() {
			this.$emit('input', this.tagList);
		},
		async doSearch(quick: boolean = false) {
			if (!quick) clearTimeout(this.searchTimeout);

			if (this.searchedTag === '') {
				return this.requestTagData();
			}

			this.searching = true;

			const results = await dataSource.search({
				filter: this.searchedTag,
				quick,
			});

			this.foundImmediateTags = results.best;
			this.foundTags = results.other;

			if (!quick || results.complete) this.searching = false;
			if (results.complete) clearTimeout(this.searchTimeout);
		},
		saveTags() {
			if (!this.tagList) return;

			const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
			history[this.id] = {
				tags: this.tagList.tags,
				time: Date.now(),
			};
			localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
		},
		async requestTagData() {
			this.dataLoaded = false;

			await dataSource.requestTagData(Object.keys(this.tagList.tags));

			this.dataLoaded = true;
		},
	},
});
</script>

<style lang="stylus" scoped>
>>>* {
	box-sizing: border-box;
}

blockquote, >>>blockquote {
	box-shadow: 2px 2px 5px #07162d;
}

.tagger {
	width: 300px;
	padding: 0;
	margin: 8px;
	overflow-x: visible;
	overflow-y: auto;
	min-height: 70px;
	max-height: 100vh;

	>.sticky {
		z-index: 50;
		padding-bottom: 0.5em;
		position: sticky;
		top: 0;
		left: 0;
		background-color: #284a81;

		>.title {
			padding: 0.5em;

			^[-3..-3].floating^[-2..-1] {
				user-select: none;
				-o-user-select: none;
				-ms-user-select: none;
				-moz-user-select: none;
				-webkit-user-select: none;
				cursor: move;
			}
		}

		>.search {
			width: 100%;
		}
	}

	>.info {
		color: #aaa;
		text-align: center;
	}
}
</style>
