const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': 'rgb(125,42,155)', '@primary-1': 'rgba(125,42,155,0.55)' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
