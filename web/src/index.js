// create-react-app + IE9
// https://www.cnblogs.com/xuexia/p/12092768.html
// react-app-polyfill
// https://www.npmjs.com/package/react-app-polyfill
import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './font.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'antd/dist/antd.css';
import {BrowserRouter} from 'react-router-dom';
import './i18n';

ReactDOM.render((
  <BrowserRouter>
    <App/>
  </BrowserRouter>
  ),
  document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
