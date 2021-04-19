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
	devtool: isDev ? (!isStandalone ? 'eval-source-map' : 'cheap-source-map') : 'hidden-source-map',
	output: {
		filename: '[name].js',
		publicPath: 'http://127.0.0.1:8080/',
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
		...(!isStandalone ? [] : [
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
		public: '127.0.0.1:8080',
		injectClient: isStandalone,
		hot: isStandalone,
	},
};

module.exports = config;
