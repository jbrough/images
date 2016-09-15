'use strict';

import Album from './Album.jsx';

import queryStr from 'query-string';

import React from 'react';

class App extends React.Component {
  _album(name, id) {
    return (
      <Album name={ name }
             id={ id }
             request={ this.props.request }
      />
    );
  }

  _index() {
    return <Index request={ this.props.request } />;
  }

  _admin() {
    return <Admin request={ this.props.request } />;
  }

  _page(params) {
    if (params.id) {
      return this._album(params.name, params.id);
    }
  }

  render() {
    const params = queryStr.parse(location.search);
    return <div>{ this._page(params) }</div>;
  }
}

App.propTypes = {
  request: React.PropTypes.func,
};

export default App;
