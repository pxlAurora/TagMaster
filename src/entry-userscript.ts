console.log('tagmaster boop');

(() => {
	// TODO: upload page
	// TODO: edit page
	const urlExtract = /^\/posts\/(\d+)/.exec(window.location.pathname);
	let tagger: any = null;

	async function createTagger(id: string) {
		if (self.tagMasterUserscript) {
			eval(self.tagMasterUserscript.GM_getResourceText('tagMaster.lazy'));
		}

		const {TagList, Tagger} = await import(/* webpackChunkName: 'tagMaster.lazy' */ './index');

		// Showing post.
		const container = document.createElement('div');
		container.id = 'tagmaster';
		document.body.appendChild(container);

		const postTags = document.querySelector<HTMLTextAreaElement>('#post_tag_string');
		if (!postTags) return;

		const postLockedTags = document.querySelector<HTMLTextAreaElement>('#post_locked_tags');

		const tagListContainer = postTags.parentElement?.parentElement;
		if (tagListContainer) tagListContainer.style.display = 'none';
	
		tagger = new Tagger({
			el: '#tagmaster',
			propsData: {
				id,
				floating: true,
				tagList: new TagList(postTags.value?.replace(/\n/g, '') ?? ''),
				lockedTagList: new TagList(postLockedTags?.value?.replace(/\n/g, '') ?? ''),
			},
		});

		tagger.$on('input', (tagList: typeof TagList) => {
			postTags.value = tagList.toString();
		});
	}

	if (!urlExtract || document.body.dataset.userLevel === "0") {
		// nop
	} else if (urlExtract[1]) {
		const editButtons = document.querySelectorAll<HTMLElement>('[href="#edit"]');

		editButtons.forEach((editButton) => {
			editButton.addEventListener('click', () => {
				if (tagger) tagger.$props.visible = true;
				else createTagger(urlExtract[1]);
			});
		});

		const respondButton = document.querySelector<HTMLElement>('[href="#comments"]');

		if (respondButton) {
			respondButton.addEventListener('click', () => {
				if (tagger) tagger.$props.visible = false;
			});
		}
	}
})();
