const fs = require('fs');
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';
const isStandalone = process.env.WEBPACK_STANDALONE === '1';

const tagDataPath = fs.realpathSync(path.resolve(__dirname, './data/tags.json'));

const config = {
	mode: isDev ? 'development' : 'production',
	target: 'web',
	entry: {
		...(isStandalone ? {
			app: './src/entry-app.ts',
		} : {
			tagMaster: './src/entry-userscript.ts',
		}),
	},
	devtool: isDev ? 'eval-source-map' : 'hidden-source-map',
	output: {
		filename: '[name].js',
		publicPath: isDev ? 'http://127.0.0.1:8080/' : 'https://github.com/pxlAurora/TagMaster/releases/latest/download/',
		chunkLoadingGlobal: 'tagWebpackJsonp',
		devtoolModuleFilenameTemplate(info) {
			if (info.resourcePath.endsWith('.vue')) {
				if (info.moduleId === '' && info.query.includes('type=script')) return `webpack:///${info.resourcePath}`;

				return `webpack:///${info.resourcePath}.${info.hash}`;
			}

			return `webpack:///${info.resourcePath}?${info.hash}`;
		},
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
			},
			{
				test: /\.(styl(us)?|css)$/,
				use: [
					'vue-style-loader',
					{
						loader: 'css-loader',
						options: {
							importLoaders: 2,
							sourceMap: false,
						},
					},
					'postcss-loader',
				],
				rules: [
					{
						test: /\.styl(us)?$/,
						use: [
							'stylus-loader',
						],
					},
				],
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							appendTsSuffixTo: [
								/\.vue$/,
							],
							onlyCompileBundledFiles: true,
						},
					},
				],
			},
			{
				test: tagDataPath,
				type: 'asset/resource',
				generator: {
					filename: 'data.json',
				},
			},
		],
	},
	resolve: {
		extensions: [
			'.js',
			'.vue',
			'.tsx',
			'.ts',
		],
		alias: {
			'tag-data$': tagDataPath,
		},
	},
	plugins: [
		new VueLoaderPlugin(),
		...(!isStandalone ? [
			new HtmlWebpackPlugin({
				templateContent: require('./userscriptTemplate.js')({
					headers: [
						['name', isDev ? '[dev] Tag Master' : 'Tag Master'],
						['namespace', isDev ? 'localhost' : 'https://github.com/pxlAurora/'],
						['version', require('./package.json').version],
						['description', 'Tagging helper for e621.'],
						['author', 'pxlAurora'],
						['homepage', 'https://github.com/pxlAurora/TagMaster/'],
						['match', 'https://e621.net/*'],
						['match', 'https://e926.net/*'],
						['run-at', 'document-idle'],
						['grant', 'GM_getResourceText'],
						['grant', 'GM_getValue'],
						['grant', 'GM_registerMenuCommand'],
						['grant', 'GM_setValue'],
						['grant', 'GM_xmlhttpRequest'],
						['grant', 'unsafeWindow'],
						...(isDev ? [
							['connect', '127.0.0.1'],
						] : [
							['connect', 'github.com'],
							['connect', 'github-releases.githubusercontent.com'],
						]),
					],
					publicPathOverrides: {
						'data.json': isDev ? false : 'https://github.com/pxlAurora/e621-tag-data/releases/latest/download/',
					},
					userscriptContents: fs.readFileSync(path.resolve(__dirname, './tagMaster.user.template.js')),
				}),
				filename: isDev ? 'tagMaster.dev.user.js' : 'tagMaster.user.js',
				chunks: ['tagMaster.js', 'tagMaster.lazy.js', 'search.worker.js', 'data.json?skipResources'],
				inject: false,
				minify: false,
			}),
		] : [
			new HtmlWebpackPlugin({
				template: require('html-webpack-template'),
				appMountId: 'app',
				filename: 'index.html',
				chunks: ['app'],
			}),
		]),
	],
	performance: {
		assetFilter(assetFilename) {
			return !/\.map$|data\.json$/.test(assetFilename);
		},
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				...(isStandalone ? {} : {
					defaultVendors: false,
				}),
			},
		},
	},
	devServer: {
		public: 'http://127.0.0.1:8080/',
		injectClient: isStandalone,
		hot: isStandalone,
	},
};

module.exports = config;
