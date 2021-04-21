function generateHeader(headers) {
	return [
		'// ==UserScript==',
		...headers.map(([name, value]) => `// @${name.padEnd(12)} ${value}`),
		'// ==/UserScript==',
	].join('\n');
}

module.exports = function userscriptTemplateGenerator({headers, publicPathOverrides, userscriptContents}) {
	return function userscriptTemplate({compilation, htmlWebpackPlugin, webpackConfig}) {
		const includeChunks = htmlWebpackPlugin.options.chunks;
		if (!includeChunks) throw new Error('Template chunks must be specified.');

		const publicPath = (webpackConfig.mode !== 'production' ? webpackConfig.devServer.public : false) || htmlWebpackPlugin.files.publicPath;

		const files = [];
		compilation.chunks.forEach((chunk) => {
			files.push(...chunk.files, ...chunk.auxiliaryFiles);
		});

		const resources = files.map((file) => {
			return compilation.getAsset(file);
		}).filter((asset) => {
			return !asset.info.development && !asset.info.hotModuleReplacement && includeChunks.includes(asset.name);
		}).map((asset) => {
			return [asset.name, ((publicPathOverrides || {})[asset.name] || publicPath) + asset.name];
		});

		const out = [
			generateHeader(
				headers.concat(
					[
						['updateURL', publicPath + htmlWebpackPlugin.options.filename],
					],
					resources.map(([name, url]) => ['resource', `${name} ${url}`]),
				),
			),
			'',
			`var T_CHUNKS = ${JSON.stringify(includeChunks)};`,
			'',
			userscriptContents,
		];

		return out.join('\n');
	};
};
