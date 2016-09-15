'use strict';

require("../css/app.css");

import App from './react/App.jsx';
import request from './lib/request';

import agent from 'superagent';
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <App request={ request(agent) } />,
  document.getElementById('react')
);
