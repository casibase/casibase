const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': 'rgb(101,16,172)', "@border-radius-base": "5px" },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
