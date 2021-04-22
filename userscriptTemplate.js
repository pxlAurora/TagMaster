function generateHeader(headers) {
	return [
		'// ==UserScript==',
		...headers.map(([name, value]) => `// @${name.padEnd(12)} ${value}`),
		'// ==/UserScript==',
	].join('\n');
}

module.exports = function userscriptTemplateGenerator({headers, publicPathOverrides, userscriptContents}) {
	return function userscriptTemplate({compilation, htmlWebpackPlugin, webpackConfig}) {
		const rawChunks = htmlWebpackPlugin.options.chunks;
		if (!rawChunks) throw new Error('Template chunks must be specified.');

		const resourcesExclude = [];
		const includeChunks = rawChunks.map((chunkName) => {
			const parts = chunkName.split('?', 2);
			if (parts.length > 1 && parts[1].includes('skipResources')) {
				resourcesExclude.push(parts[0]);
			}
			return parts[0];
		});

		const publicPath = (webpackConfig.mode !== 'production' ? webpackConfig.devServer.public : false) || htmlWebpackPlugin.files.publicPath;

		const files = [];
		compilation.chunks.forEach((chunk) => {
			files.push(...chunk.files, ...chunk.auxiliaryFiles);
		});

		const assets = files.map((file) => {
			return compilation.getAsset(file);
		}).filter((asset) => {
			return !asset.info.development && !asset.info.hotModuleReplacement && includeChunks.includes(asset.name);
		}).reduce((acc, asset) => {
			acc[asset.name] = ((publicPathOverrides || {})[asset.name] || publicPath) + asset.name;
			return acc;
		}, {});

		const out = [
			generateHeader(
				headers.concat(
					[
						['updateURL', publicPath + htmlWebpackPlugin.options.filename],
					],
					Object.entries(assets).filter(([name]) => !resourcesExclude.includes(name)).map(([name, url]) => ['resource', `${name} ${url}`]),
				),
			),
			'',
			`var T_ASSETS = ${JSON.stringify(assets)};`,
			'',
			userscriptContents,
		];

		return out.join('\n');
	};
};
