const path = require('path');
const microProjectConfig = require(path.resolve(__dirname, '../../microProject.json'));
const fs = require('fs');

function MyPlugin(options) {
  this.options = options;
}

MyPlugin.prototype.apply = function (compiler) {
  let options = this.options;
  let filePath = options.filePath;
  let fileString = fs.readFileSync(filePath, 'utf-8');

  compiler.plugin('emit', function (compilation, callback) {
    // 遍历所有编译过的资源文件，进行匹配。
    for (let filename in compilation.assets) {
      if (filename.indexOf('singleSpaEntry') > -1) {
        fileString = fileString.replace('singleSpaEntry.js', filename);
      }
    }

    // 将这个配置项作为一个新的文件资源，插入到 webpack 构建中：
    compilation.assets[`${microProjectConfig.name}/microProject.json`] = {
      source: function () {
        return fileString;
      },
      size: function () {
        return fileString.length;
      }
    };
    callback();
  });
};

module.exports = MyPlugin;
