console.log('tagmaster boop');

interface Window {
	Danbooru: any;
}

interface CreateTaggerOptions {
	id: string;
	postTags?: HTMLTextAreaElement | null;
	hidePostTags?: boolean;
	postLockedTags?: HTMLTextAreaElement | null;
	attachOn?: HTMLElement | null;
}

(() => {
	if (document.body.dataset.userLevel === "0") return;

	let tagger: any = null;
	let initialized = false;

	async function createTagger({id, postTags, hidePostTags, postLockedTags, attachOn}: CreateTaggerOptions) {
		const newTags = postTags?.value?.replace(/\n/g, ' ') ?? '';
		const newLockedTags = postLockedTags?.value?.replace(/\n/g, ' ') ?? '';

		if (tagger) {
			tagger.saveTags();

			tagger.id = id;

			tagger.tagList.set(newTags);
			tagger.lockedTagList.set(newLockedTags);

			tagger.requestTagData();
			tagger.visible = true;

			return;
		}

		if (self.tagMasterUserscript && !initialized) {
			eval(self.tagMasterUserscript.GM_getResourceText('tagMaster.lazy.js'));

			initialized = true;
		}

		const {TagList, Tagger} = await import(/* webpackChunkName: 'tagMaster.lazy' */ './index');

		if (!attachOn) {
			const container = document.createElement('div');
			container.id = 'tagmaster';
			document.body.appendChild(container);

			attachOn = container;
		}

		if (hidePostTags && postTags) {
			const tagListContainer = postTags.parentElement?.parentElement;
			if (tagListContainer) tagListContainer.style.display = 'none';
		}
	
		tagger = new Tagger({
			el: attachOn,
			propsData: {
				id,
				floating: true,
				tagList: new TagList(newTags),
				lockedTagList: new TagList(newLockedTags),
			},
		});

		if (postTags) {
			tagger.$on('input', (tagList: typeof TagList) => {
				postTags.value = tagList.toString();
			});
		}
	}

	function hideTagger() {
		if (!tagger) return;

		tagger.visible = false;
	}

	let matches: null | RegExpMatchArray;

	if ((matches = /^\/posts\/(\d+)/.exec(window.location.pathname)) && matches[1]) {
		const id = matches[1];
		const editButtons = document.querySelectorAll<HTMLElement>('[href="#edit"]');

		editButtons.forEach((editButton) => {
			editButton.addEventListener('click', () => {
				createTagger({
					id,
					postTags: document.querySelector<HTMLTextAreaElement>('#post_tag_string'),
					postLockedTags: document.querySelector<HTMLTextAreaElement>('#post_locked_tags'),
				});
			});
		});

		const respondButton = document.querySelector<HTMLElement>('[href="#comments"]');

		if (respondButton) {
			respondButton.addEventListener('click', () => {
				hideTagger();
			});
		}
	} else if (matches = /^\/uploads\/new/.exec(window.location.pathname)) {
		createTagger({
			id: 'new',
			postTags: document.querySelector<HTMLTextAreaElement>('#post_tags'),
		});
	} else if (matches = /^\/posts/.exec(window.location.pathname)) {
		if (!self.Danbooru.PostModeMenu.tm_open_edit) {
			self.Danbooru.PostModeMenu.tm_open_edit = self.Danbooru.PostModeMenu.open_edit;
			self.Danbooru.PostModeMenu.tm_close_edit_form = self.Danbooru.PostModeMenu.close_edit_form;

			self.Danbooru.PostModeMenu.open_edit = function(id: any) {
				self.Danbooru.PostModeMenu.tm_open_edit(id);

				createTagger({
					id: '' + id,
					postTags: document.querySelector<HTMLTextAreaElement>('#post_tag_string'),
				});
			}

			self.Danbooru.PostModeMenu.close_edit_form = function() {
				hideTagger();

				self.Danbooru.PostModeMenu.tm_close_edit_form();
			}
		}
	}
})();
