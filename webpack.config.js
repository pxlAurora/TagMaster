const webpack = require('webpack');
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';
const isDevServer = process.env.WEBPACK_SERVER === '1';

const config = {
	mode: isDev ? 'development' : 'production',
	target: 'web',
	entry: (isDevServer ? {
		app: './src/entry-app.ts',
	} : {
		tagMaster: './src/entry-userscript.ts',
	}),
	devtool: isDev ? 'cheap-source-map' : 'hidden-source-map',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: isDev ? '[name].js' : '[name].[contenthash].js',
		publicPath: isDevServer ? undefined : 'https://127.0.0.1:8080/',
		jsonpFunction: 'tagWebpackJsonp',
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
					'postcss-loader'
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
				inject: false,
				appMountId: 'app',
				filename: 'index.html',
			}),
		]),
	],
	optimization: {
		runtimeChunk: {
			name: isDevServer ? 'app' : 'tagMaster',
		},
		splitChunks: {
			// fuck this section. so much. forcing webpack to lazy load shit is apparently impossible.
			chunks: 'all',
			maxInitialRequests: 10,
			cacheGroups: {
				app: {
					test: ({resource: f}) => /[\\/]src[\\/]/.test(f) && !f.includes('entry-'),
					name: 'app',
					enforce: true,
				},
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					enforce: true,
					priority: 50,
				},
				data: {
					test: /e-scraper/,
					name: 'data',
					enforce: true,
					priority: 100,
				},
			},
		},
	},
	performance: {
		assetFilter(assetFilename) {
			return !(/\.map$|data(\.\w+)?\.js$/.test(assetFilename));
		},
	},
	devServer: {
		public: '127.0.0.1:8080',
		hot: true,
	},
};

module.exports = config;
