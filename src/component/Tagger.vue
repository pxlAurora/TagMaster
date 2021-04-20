<template>
	<blockquote class="tagger" :class="{floating}" v-show="visible" :style="getFloatingStyles()">
		<div class="sticky">
			<h5 class="title" @mousedown.left="onMouseDown">Tag Master</h5>
			<input class="search" type="text" v-model="searchedTag" @keypress.enter="doSearch" title="Search for tags. Spaces are used to create AND filters. Start with / to use RegEx. # for tag groups. @ for list of top 500 popular tags." />
		</div>
		<div v-if="dataLoaded" v-show="!dragging">
			<tag v-for="(t, index) in shownTags" :key="t" :tagName="t" :expandUntil="index < foundImmediateTags.length ? 0 : -1" :tagList="tagList" :lockedTagList="lockedTagList" />
		</div>
		<div v-else class="info">
			(loading)
		</div>
		<div v-if="searching" class="info">
			(searching)
		</div>
	</blockquote>
</template>

<script lang="ts">
import Vue from 'vue';

import {TagData, TagType} from '../common/types';
import Tag from './Tag.vue';
import {TagList} from '../TagList';
import searchWorker, {tagData} from '../searchWorker';

const HISTORY_KEY = 'tags.history';
const UNLOAD_CONFIRM = () => confirm('Do you really want to leave? You might lose unsaved changes.');

const TAG_TYPE_ORDER = [TagType.ARTIST, TagType.CHARACTER, TagType.COPYRIGHT, TagType.SPECIES, TagType.GENERAL, TagType.META, TagType.LORE];

// I kind of don't like how many special cases related tags require. Can something be done about this?

export default Vue.extend({
	components: {
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
			default: () => new TagList('male female'),
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
			mouseMoveHandler: null as typeof window['onmousemove'],
			mouseUpHandler: null as typeof window['onmouseup'],
			windowResizeHandler: null as typeof window['onresize'],
			dragging: false,
			position: [0, 0] as [number, number],
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
		floating() {
			// Position the element to exactly where it was when it became floating.
			const bb = this.$el.getBoundingClientRect();
			const style = window.getComputedStyle(this.$el);
			this.position = [bb.left - parseFloat(style.marginLeft), bb.top - parseFloat(style.marginTop)];
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
				} else {
					this.dataLoaded = true;
				}
			} else {
				this.dataLoaded = true;
			}
		} else {
			this.requestTagData();
		}
	},
	mounted() {
		// Technically not great but whatever, good enough. Let's just hope nothing else interacts with it. addEventListener doesn't work for this.
		if (window.onbeforeunload !== UNLOAD_CONFIRM) this.oldBeforeUnloadHandler = window.onbeforeunload;
		window.onbeforeunload = UNLOAD_CONFIRM;

		// Always register floating related listeners in case the floating prop changes.
		this.mouseMoveHandler = this.onMouseMove.bind(this);
		window.addEventListener('mousemove', this.mouseMoveHandler);
		this.mouseUpHandler = () => this.dragging = false;
		window.addEventListener('mouseup', this.mouseUpHandler);
		this.windowResizeHandler = this.$forceUpdate.bind(this);
		window.addEventListener('resize', this.windowResizeHandler);
	},
	beforeDestroy() {
		if (window.onbeforeunload === UNLOAD_CONFIRM) window.onbeforeunload = this.oldBeforeUnloadHandler;

		if (this.mouseMoveHandler) window.removeEventListener('mousemove', this.mouseMoveHandler);
		if (this.mouseUpHandler) window.removeEventListener('mouseup', this.mouseUpHandler);
		if (this.windowResizeHandler) window.removeEventListener('resize', this.windowResizeHandler);
	},
	methods: {
		emitInput() {
			this.$emit('input', this.tagList);
		},
		async doSearch(quick: boolean = false) {
			if (!quick) clearTimeout(this.searchTimeout);

			this.searching = true;

			const results = await searchWorker.search({
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
		// Floating
		onMouseDown() {
			if (!this.floating) return;

			this.dragging = true;

			// Fix position being out of bounds at the start of drag.
			const style = this.getFloatingStyles();
			this.position = [
				parseFloat(style.left),
				parseFloat(style.top),
			];
		},
		onMouseMove(event: MouseEvent) {
			if (!this.dragging || !this.floating) return;

			this.position = [this.position[0] + event.movementX, this.position[1] + event.movementY];
		},
		getFloatingStyles(): Record<string, any> {
			if (!this.floating) return {};

			let maxHeight: string | undefined = undefined;
			let maxSize: [number, number] = [window.innerWidth, window.innerHeight];

			if (this.$el) {
				const style = window.getComputedStyle(this.$el);

				maxHeight = `${window.innerHeight - Math.max(0, this.position[1]) - parseFloat(style.marginTop) - parseFloat(style.marginBottom)}px`;
				maxSize[0] -= this.$el.clientWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
				maxSize[1] -= this.$el.clientHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
			};

			return {
				left: `${Math.max(0, Math.min(maxSize[0], this.position[0]))}px`,
				top: `${Math.max(0, Math.min(maxSize[1], this.position[1]))}px`,
				maxHeight,
			};
		},
		async requestTagData() {
			this.dataLoaded = false;

			await searchWorker.requestTagData(Object.keys(this.tagList.tags));

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

	&.floating {
		z-index: 10;
		position: fixed;
	}

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
