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
	font-size: 85%;
	line-height: 1.25em;
}

blockquote {
	background-color: #284a81;
	border: 1px solid #174891;
	border-radius: 3px;
	padding: 1em 1em .2rem;
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
	font-size: 1em;
}

.button {
	display: inline-block;
	box-sizing: border-box;
	border-radius: 6px;
	font-size: 1rem;
	line-height: 1.25rem;
	padding: .25rem .5rem;
	border: 0;
}

.styled-dtext .dtext-color-gen, .styled-dtext .dtext-color-general {
	color: #b4c7d9;
}

.styled-dtext .dtext-color-art, .styled-dtext .dtext-color-artist {
	color: #f2ac08;
}

.styled-dtext .dtext-color-copy, .styled-dtext .dtext-color-copyright {
	color: #d0d;
}

.styled-dtext .dtext-color-char, .styled-dtext .dtext-color-character {
	color: #0a0;
}

.styled-dtext .dtext-color-spec, .styled-dtext .dtext-color-species {
	color: #ed5d1f;
}

.styled-dtext .dtext-color-inv, .styled-dtext .dtext-color-invalid {
	color: #ff3d3d;
}

.styled-dtext .dtext-color-meta {
	color: #fff;
}

.styled-dtext .dtext-color-lor, .styled-dtext .dtext-color-lore {
	color: #282;
}

.app {
	display: flex;
	flex-direction: row;
	height: 100vh;
	box-sizing: border-box;
}
</style>
