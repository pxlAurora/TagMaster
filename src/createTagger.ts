export default async function createTagger() {
	const {default: Tagger} = await import('./component/Tagger');
	const {TagList} = await import('./TagList');

	const urlExtract = /^\/post\/show\/(\d+)/.exec(window.location.pathname);
	if (!urlExtract) return;

	// Showing post.
	const container = document.createElement('div');
	container.id = 'tagmaster';
	document.body.appendChild(container);

	const postTags = document.querySelector('#post_tags');
	if (!postTags) return;

	const tagListContainer = postTags.parentElement?.parentElement;
	if (tagListContainer) tagListContainer.style.display = 'none';

	const tagger = new Tagger({
		el: '#tagmaster',
		propsData: {
			id: urlExtract![1],
			tagList: new TagList(postTags.textContent ?? ''),
			floating: true,
		},
	});

	tagger.$on('input', function() {
		console.log('input event!', arguments);
	});
}
