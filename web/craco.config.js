const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': 'rgb(92,48,125)', '@primary-1': 'rgba(92,48,125,0.55)' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
