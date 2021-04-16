const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';
const isDevServer = process.env.WEBPACK_SERVER === '1';

const filenamePattern = isDev ? '[name].js' : '[name].[contenthash].js';

const config = {
	mode: isDev ? 'development' : 'production',
	target: 'web',
	entry: {
		...(isDevServer ? {
			app: './src/entry-app.ts',
		} : {
			tagMaster: './src/entry-userscript.ts',
		}),
	},
	devtool: isDev ? 'cheap-source-map' : 'hidden-source-map',
	output: {
		filename: filenamePattern,
		publicPath: isDevServer ? undefined : 'https://127.0.0.1:8080/',
		chunkLoadingGlobal: 'tagWebpackJsonp',
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
			},
			{
				test: /\.css$/,
				use: [
					'vue-style-loader',
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
						},
					},
					'postcss-loader',
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
				test: /\.styl(us)?$/,
				use: [
					'vue-style-loader',
					'css-loader',
					'stylus-loader',
				],
			},
			{
				test: /e-scraper/,
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
			'tag-data$': path.resolve(__dirname, './data/tags.json'),
		},
	},
	plugins: [
		new VueLoaderPlugin(),
		...(!isDevServer ? [] : [
			new HtmlWebpackPlugin({
				template: require('html-webpack-template'),
				appMountId: 'app',
				filename: 'index.html',
				excludeChunks: ['searchWorker'],
			}),
		]),
	],
	optimization: {
		splitChunks: {
			chunks: 'all',
			maxInitialRequests: 10,
		},
	},
	performance: {
		assetFilter(assetFilename) {
			return !(/\.map$|data\.json$/.test(assetFilename));
		},
	},
	devServer: {
		public: '127.0.0.1:8080',
		hot: true,
	},
};

module.exports = config;
