const path = require('path')
const { defineConfig } = require('@vue/cli-service')
function resolve(dir) {
  return path.join(__dirname, dir)
}
module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    proxy: {
      '/api': {
        // 替换后端地址
        target: 'http://localhost:18088',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    // 关键：用 watchFiles 替代旧的 watchOptions
    watchFiles: {
      paths: ['src/**/*', 'public/**/*'],  // 只监听你需要的目录
      options: {
        usePolling: false,
        interval: 1000,
        // 重点：忽略 public 里的大文件或子目录，防止文件句柄爆炸
        ignored: [
          path.resolve(__dirname, 'public/**/*'),
          // 或者更狠，直接全忽略 public（推荐！）
          // 'public/**',
          'node_modules/**'
        ]
      }
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  },
  chainWebpack: (config) => {
    config.resolve.alias.set('vue-i18n', 'vue-i18n/dist/vue-i18n.cjs.js')
    config.module.rule('svg').exclude.add(resolve('src/icons')).end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
  }
})
