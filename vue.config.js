const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8090,
    proxy: {
      '/api': {
        target: 'http://localhost:8100',
        changeOrigin: true,
        secure: false
      },
       '/uploads': {
         target: 'http://localhost:8100',
         changeOrigin: true,
         secure: false,
         pathRewrite: {
           '^/uploads': '/api/uploads'
         }
       }

    }
  }
})