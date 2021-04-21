import Vue from 'vue';

import {tagData} from './workerClient';

export class TagList {
	/** Holds `false` if tag is implied, `true` if it's hard added. */
	tags: Record<string, boolean> = {};

	constructor(initial: string | string[] = '') {
		this.set(initial);

		return Vue.observable(this);
	}

	toString() {
		return Object.entries(this.tags).filter(([, implied]) => implied !== false).map(([name]) => name).sort().join(' ');
	}

	set(tags: string | string[]) {
		this.clear();

		if (typeof(tags) === 'string') {
			tags = tags.split(/\s+/);
		}

		tags.forEach((tag) => this.add(tag));
	}

	add(tag: string, implied: boolean = false) {
		tag = tag.trim();

		if (tag === '') return;

		const resolved = tagData.alias[tag] || tag;
		const existing = this.tags[resolved];

		Vue.set(this.tags, resolved, !implied);

		// Tag already exists - mark it with the requested state and stop since the implications will already exist.
		if (existing !== undefined) return;

		// Cascade to tags that don't already exist.
		const tagMeta = tagData.tags[resolved];
		if (tagMeta) {
			tagMeta.implies.forEach((implied) => {
				if (this.tags[implied] === undefined) this.add(implied, true);
			});
		}
	}

	remove(tag: string, impliedOnly: boolean = false) {
		const existing = this.tags[tag];
		if (existing === undefined) return;

		// For cascading.
		if (impliedOnly && existing !== false) return;

		// If this tag is implied by another tag, mark it as such and don't cascade.
		const tagMeta = tagData.tags[tag];
		if (tagMeta && tagMeta.impliedBy.some((impliedBy) => this.tags[impliedBy] !== undefined)) {
			Vue.set(this.tags, tag, false);
			return;
		}

		Vue.delete(this.tags, tag);

		if (tagMeta) {
			tagMeta.implies.forEach((implies) => {
				this.remove(implies, true);
			});
		}
	}

	clear() {
		this.tags = {};
	}

	size() {
		return Object.keys(this.tags).length;
	}

	includes(tag: string): boolean {
		return this.tags[tag] !== undefined;
	}

	isImplied(tag: string): boolean {
		return this.tags[tag] === false;
	}
}
