<template>
	<div class="app">
		<tagger :tagList="tagList" :floating="floating" />
		<textarea style="margin: 16px;" v-model="initial" @input="updateTagListFromInitial"></textarea>
		<label><input type="checkbox" v-model="floating" /> Floating</label>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

import Tagger from './component/Tagger.vue';
import {TagList} from './TagList';

export default Vue.extend({
	components: {
		Tagger,
	},
	data() {
		return {
			initial: '',
			tagListUpdateTimeout: -1,
			tagList: new TagList(),
			floating: false,
		};
	},
	watch: {
		tagList: {
			deep: true,
			handler() {
				this.initial = this.tagList.toString();
			},
		},
	},
	methods: {
		updateTagListFromInitial() {
			clearTimeout(this.tagListUpdateTimeout);

			this.tagListUpdateTimeout = window.setTimeout(() => {
				this.tagList = new TagList(this.initial);
			}, 300);
		},
	},
});
</script>

<style lang="stylus">
html {
	background-color: #152f56;
	color: #fff;
	font-family: sans-serif;
}

body {
	margin: 0;
	font-size: 82%;
}

blockquote {
	background-color: #284a81;
	border: 1px solid #174891;
	border-radius: 4px;
	box-shadow: 2px 2px 5px #07162d;
	padding: 1em 1em 0;
}

a {
	color: #b4c7d9;
	text-decoration: none;

	&:hover {
		color: #2e76b4;
	}
}

h5 {
	margin: 0;
	padding: 0;
	font-size: 1.2em;
}

.app {
	display: flex;
	flex-direction: row;
	height: 100vh;
	box-sizing: border-box;
}
</style>
