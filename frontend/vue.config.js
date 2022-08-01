const path = require('path');
const microProjectConfig = require(path.resolve(__dirname, 'microProject.json'));
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UniMicroPlugin = require('./build/plugin/UniMicroPlugin');
function resolve(dir) {
	return path.join(__dirname, dir)
  }
module.exports = {
	
	lintOnSave:false,
	outputDir: path.resolve(__dirname, `release`),
	assetsDir: './bide',
	publicPath: './',
	transpileDependencies: ['@pillarjs', '@unicloud'],
	devServer: {
		port: 9528,
		compress: true,
		hot: true,
		inline: true,
		historyApiFallback: true,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, De-Authorization'
		},
		// proxy: {
		
        //  '/bideService': {
		// 		target: 'http://10.0.39.34:10119',
		// 		pathRewrite:  {"/bideService": ""},
		// 		changOrigin: true,

       	//  	}
		// }
	},
	configureWebpack: {
		output: {
			libraryTarget: 'umd',
			library: microProjectConfig.name
		},
		entry: {
			singleSpaEntry: path.resolve(__dirname, 'src/singleSpaEntry.js'),
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
				'vue$': 'vue/dist/vue.esm.js',
			},
			extensions: [
				".js", ".vue"
			],
			modules: [
				__dirname,
				'node_modules',
			],
		},
		externals: {
			'vue': 'umd vue',
			'vuex': 'umd vuex',
			'vue-router': 'umd vue-router',
			'axios': 'axios',
			'@unicloud/element-ui': 'umd @unicloud/element-ui',
		},
		plugins: [
			new UniMicroPlugin({
				filePath: path.resolve(__dirname, 'microProject.json')
			})
		],
	},
	chainWebpack: config => {
		config.module.rules.delete('svg') // 删除默认配置中处理svg,
		// const svgRule = config.module.rule('svg')
		// svgRule.uses.clear()
		config.module
		  .rule('svg-sprite-loader')
		  .test(/\.svg$/)
		  .include
		  .add(resolve('src/icons')) // 处理svg目录
		  .end()
		  .use('svg-sprite-loader')
		  .loader('svg-sprite-loader')
		  .options({
			symbolId: 'icon-[name]'
		  })
		// 修改 entry file 
		config
			.entry("app")
			.clear()
			.add("./src/singleSpaEntry.js")
			.end();

		// 修改 copy-webpack-plugin
		config
			.plugin('copy')
			.use(CopyWebpackPlugin, [[
				{ from: path.resolve(__dirname, 'public/'), to: path.resolve(__dirname, `release/${microProjectConfig.name}/`) }
			]]);

		// 移除 html-webpack-plugin
		config.plugins.delete('html');
		config.plugins.delete('preload');
		config.plugins.delete('prefetch');
	}
};
