<template>
	<div class="tag-container">
		<div class="inner">
			<div class="button" v-if="tagList">
				<input v-if="(tag || !isGroup) && (resolvedName !== 'invalid_tag' || tagName === 'invalid_tag')" ref="checkbox" class="use" type="checkbox" @click.left.prevent="updateCheck" :checked="tagList.includes(name)" :indeterminate.prop="tagList.isImplied(name)" :disabled.prop="lockedTagList && lockedTagList.includes(name)" />
			</div>
			<div class="spacer" :style="{width: `${depth * 10}px`}"></div>
			<div class="button">
				<div v-if="children.length > 0" class="expand" @click.left="expand = !expand">{{ expand ? '▼' : '▲' }}</div>
			</div>
			<div class="tag">
				<template v-if="tag">
					<span :class="`type-${tag.type}`" @click.left="expand = !expand">
						{{ name }}
						<span v-if="name !== tagName || isGroup" class="alias-of" :title="tagName">&lt;{{ aliasName }}&gt;</span>
					</span>
					<span class="count">{{ tag.count }}</span>
					<span class="help" v-if="tag.hint">
						&nbsp;<a :href="`https://e621.net/wiki/show/${encodeURIComponent(name)}`" target="_blank">?</a>
						<blockquote class="popup">{{ tag.hint || '[hint empty]' }}</blockquote>
					</span>
				</template>
				<template v-else-if="isGroup">
					<span class="group" @click.left="expand = !expand" :title="tagName">{{ aliasName }}</span>
				</template>
				<template v-else>
					<span class="tag-unknown" @click.left="expand = !expand">{{ tagName }} (unknown)</span>
				</template>
			</div>
		</div>
		<template v-if="expand">
			<tag v-for="t in children" :key="t" :tagName="t" :depth="depth + 1" :expandUntil="expandUntil" :tagList="tagList" :lockedTagList="lockedTagList" />
		</template>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

import tagData from '../tagData';
import {TagList} from '../TagList';
import {Tag} from '../types';

export default Vue.extend({
	name: 'tag',
	props: {
		tagName: {
			type: String,
			required: true,
		},
		depth: {
			type: Number,
			default: 0,
		},
		expandUntil: {
			type: Number,
			default: -1,
		},
		tagList: {
			type: TagList,
			default: null,
		},
		lockedTagList: {
			type: TagList,
			default: null,
		},
	},
	data() {
		return {
			expand: this.depth <= this.expandUntil,
		};
	},
	watch: {
		tagName() {
			this.expand = this.depth <= this.expandUntil;
		},
	},
	computed: {
		/**
		 * Tag after alias resolution.
		 */
		resolvedName(): string {
			return this.resolveTag(this.tagName);
		},
		/**
		 * The effective tag that this element represents. For groups it might be different than the resolvedName.
		 */
		name(): string {
			const resolved = this.resolvedName;
			if (resolved[0] !== '#') return resolved;

			// Always return an empty string for related groups to ensure they're displayed as a group and not a repeat of the tag.
			// if (resolved.startsWith('#related/')) return '';

			// If the last part matches an valid existing tag, pretend the group itself is a tag.
			const lastSlashIndex = resolved.lastIndexOf('/');
			const lastPart = resolved.substr(lastSlashIndex === -1 ? 1 : lastSlashIndex + 1);
			if (tagData.tags[lastPart] && this.resolveTag(lastPart) !== 'invalid_tag') return lastPart;

			return resolved;
		},
		/**
		 * Value displayed as the alias or as the primary name if it's a group.
		 */
		aliasName(): string {
			if (!this.isGroup) return this.tagName;

			if (this.resolvedName.startsWith('#related/') && this.name[0] !== '#') return '#related';

			if (this.tag) return this.resolvedName.includes('/') ? '#/' : '#';

			const lastSlashIndex = this.resolvedName.lastIndexOf('/');
			return lastSlashIndex < 0 ? this.resolvedName : `#${this.resolvedName.substr(lastSlashIndex)}`;
		},
		tag(): Tag {
			return tagData.tags[this.name];
		},
		isGroup(): boolean {
			return this.resolvedName[0] === '#';
		},
		group(): string[] {
			return tagData.tagGroups[this.resolvedName];
		},
		children(): string[] {
			if (this.isGroup) return this.group;
			if (this.tag) {
				if (tagData.tagGroups[`#related/${this.name}`]) return this.tag.impliedBy.concat(`#related/${this.name}`);
				return this.tag.impliedBy;
			}
			return [];
		},
	},
	methods: {
		resolveTag(name: string): string {
			return tagData.alias[name] || name;
		},
		updateCheck(event: MouseEvent) {
			setTimeout(() => {
				if (!this.tagList) return;

				if (!this.tagList.includes(this.name) || this.tagList.isImplied(this.name)) this.tagList.add(this.name);
				else this.tagList.remove(this.name);
			}, 0);
		},
	},
});
</script>

<style lang="stylus" scoped>
.tag-container {
	>.inner {
		display: flex;
		flex-direction: row;
		min-height: 22px;
		align-items: center;

		>.button {
			flex-grow: 0;
			flex-shrink: 0;
			width: 23px;

			>.expand {
				display: inline-block;
				width: 100%;
				height: 100%;
				text-align: center;
				vertical-align: middle;
				cursor: pointer;
			}
		}

		>.spacer {
			flex-shrink: 0;
		}

		>.tag {
			flex-grow: 1;

			>.type-0 {
				color: #b4c7d9;
			}

			>.type-1 {
				color: #f2ac08;
				// font-weight: bold;
			}

			>.type-3 {
				// color: #d0d;
				color: #ff5eff;
				// font-weight: bold;
			}

			>.type-4 {
				color: #0a0;
				// font-weight: bold;
			}

			>.type-5 {
				// color: #ed5d1f;
				color: #f6b295;
				// font-weight: bold;
			}

			>.type-7 {
				color: #eee;
			}

			>.type-8 {
				color: #282;
			}

			>.alias-of {
				color: #ddd;
			}

			>.count {
				color: #aaa;
			}

			>.help {
				position: relative;

				>.popup {
					z-index: 1;
					display: none;
					position: absolute;
					top: 1.2em;
					margin: 0;
					padding: 1em;
					width: 200px;

					^[..-2]:hover ^[-1..-1] {
						display: block;
					}
				}
			}
		}
	}
}
</style>
