<template>
	<input type="checkbox" @click.left.prevent="updateCheck" :checked="tagList.includes(name)" :indeterminate.prop="tagList.isImplied(name)" :disabled.prop="lockedTagList && lockedTagList.includes(name)" />
</template>

<script lang="ts">
import Vue, {VNode} from 'vue';

import {TagList} from '../TagList';

export default Vue.extend({
	props: {
		name: {
			type: String,
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
	methods: {
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
