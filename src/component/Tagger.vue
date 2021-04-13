<template>
	<blockquote class="tagger" :class="{floating}" v-show="visible" :style="getFloatingStyles()">
		<div class="sticky">
			<h5 class="title" @mousedown.left="onMouseDown">Tag Master</h5>
			<input class="search" type="text" v-model="searchedTag" @keypress.enter="doSearch" title="Search for tags. Spaces are used to create AND filters. Start with / to use RegEx. # for tag groups. @ for list of top 500 popular tags." />
		</div>
		<div v-show="!dragging">
			<tag v-for="(t, index) in shownTags" track-by="t" :key="t" :tagName="t" :expandUntil="index < foundImmediateTags.length ? 0 : -1" :tagList="tagList" :lockedTagList="lockedTagList" />
		</div>
	</blockquote>
</template>

<script lang="ts">
import Vue from 'vue';

import Tag from './Tag.vue';
import tagData from '../tagData';
import {TagList} from '../TagList';
import {TagData, TagType} from '../types';

// FIXME: this shouldnt be handled on load
const POPULAR = (() => {
	const stored = localStorage.getItem('tags.popular');
	const popular = stored ? JSON.parse(stored) : Object.entries(tagData.tags).filter(([, {count}]) => count > 10000).sort(([, a], [, b]) => b.count - a.count).slice(0, 500).map(([tag]) => tag);
	if (!stored) localStorage.setItem('tags.popular', JSON.stringify(popular));
	return popular;
})();

const GROUPS = (() => {
	const stored = localStorage.getItem('tags.rootGroups');
	const groups = stored ? JSON.parse(stored) : Object.keys(tagData.tagGroups).filter((name) => !name.includes('/')).sort();
	if (!stored) localStorage.setItem('tags.rootGroups', JSON.stringify(groups));
	return groups;
})();

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
			oldSearchedTag: '',
			searchedTag: '',
			foundImmediateTags: [] as string[],
			foundTags: [] as string[],
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
			if (this.searchedTag === '@') {
				return POPULAR;
			} else if (this.searchedTag === '#') {
				return GROUPS;
			} else if (this.searchedTag) {
				return this.foundImmediateTags.concat(this.foundTags.slice(0, 200));
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
			handler() {
				this.emitInput();
				this.saveTags();
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
				}
			}
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
		doSearch(quick: boolean = false) {
			if (!quick) clearTimeout(this.searchTimeout);

			if (this.searchedTag[0] === '#') {
				if (this.searchedTag[1] === '#') {
					// '##' is a shortcut to the index tag group.
					this.foundImmediateTags = ['#index'];
					this.foundTags = [];
					return;
				} else if (this.searchedTag.startsWith('#+')) {
					// '#+' marks a sequence of tags to display as a list.
					this.foundImmediateTags = [];
					this.foundTags = this.searchedTag.substr(2).split(/\s+/).filter((tag) => tag);
					return;
				}

				if (quick) {
					this.foundImmediateTags = tagData.tagGroups[this.searchedTag] ? [this.searchedTag] : [];
					this.foundTags = [];
				} else {
					const exact = tagData.tagGroups[this.searchedTag];

					if (exact) {
						this.foundImmediateTags = [this.searchedTag];
						this.foundTags = [];
					} else {
						// The old algorithm that only searches in the first tag group. Returns much less but is much cleaner. Could probably be optimized by using a regex.
						// const found = Object.keys(tagData.tagGroups).filter((name) => name.includes(this.searchedTag) && name.indexOf('/', this.searchedTag.length) === -1);

						// '#/' searches in the last part of the tag group name, '#' searches in the first part.
						const regex = new RegExp(this.searchedTag[1] === '/' ? `[#/][^/]*?${this.searchedTag.substr(2).replace(/([^a-zA-Z0-9])/, '\\$1')}[^/]*?$` : `#[^/]*?${this.searchedTag.substr(1).replace(/([^a-zA-Z0-9])/, '\\$1')}(?:$|[^/]*)`);

						const found: string[] = [];
						const related: string[] = [];
						Object.keys(tagData.tagGroups).filter((name) => regex.test(name)).forEach((tag) => {
							if (tag.startsWith('#related/')) related.push(tag);
							else found.push(tag);
						});

						this.foundImmediateTags = found.length === 1 ? found : [];
						this.foundTags = found.length > 1 ? found.concat(related) : related;
					}
				}

				return;
			}

			if (this.searchedTag.length === 0) {
				this.foundImmediateTags = [];
				this.foundTags = [];
			} else if (this.searchedTag[0] === '/') {
				if (quick) {
					this.foundImmediateTags = ['#press_enter'];
					this.foundTags = [];
				} else {
					const regex = new RegExp(this.searchedTag.substr(1));

					this.foundImmediateTags = [this.searchedTag.substr(1)];
					this.foundTags = Object.keys(tagData.tags).filter((tag) => regex.test(tag) && tag !== this.searchedTag);
				}
			} else {
				const filters = this.searchedTag.split(' ').filter((filter) => !quick || filter.length > 3);

				this.foundImmediateTags = filters.length > 1 ? [] : filters;
				this.foundTags = (quick ? this.foundTags : Object.keys(tagData.tags)).filter((tag) => filters.every((filter) => tag.includes(filter)) && !filters.includes(tag));
			}

			this.oldSearchedTag = this.searchedTag;
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

				maxHeight = `${window.innerHeight - this.position[1] - parseFloat(style.marginTop) - parseFloat(style.marginBottom)}px`;
				maxSize[0] -= this.$el.clientWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
				maxSize[1] -= this.$el.clientHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
			};

			return {
				left: `${Math.max(0, Math.min(maxSize[0], this.position[0]))}px`,
				top: `${Math.max(0, Math.min(maxSize[1], this.position[1]))}px`,
				maxHeight,
			};
		},
	},
});
</script>

<style lang="stylus" scoped>
>>>* {
	box-sizing: border-box;
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
}
</style>
