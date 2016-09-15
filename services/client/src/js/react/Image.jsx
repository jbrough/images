'use strict';

import React from 'react';
import _ from 'lodash';

class Image extends React.Component {
  _src() {
    return `${this.props.baseURL}/${this.props.bucket}/${this.props.type}_${this.props.id}.jpg?${new Date().getTime()}`;
  }

  _originalSrc() {
    return `${this.props.baseURL}/${this.props.id}.jpg`;
  }

  _delete() {
    this.props.delete(this.props.id);
  }

  _move(evt) {
    this.props.move(this.props.id, evt.target.value);
  }

  _url() {
    return `${this.props.baseURL}/${this.props.bucket}/${this.props.id}.jpg`;
  }

  _friendlyName() {
    return `${this.props.albumID}-${this.props.index}`;
  }

  _download() {
    return (<a href={ this._url() } download={ this._friendlyName() }>Download</a>);
  }

  _deleteButton() {
    return (<button type="button" className="del" ref="#" onClick={ this._delete.bind(this) }>Delete</button>);
  }

  _sortSelect() {
    return (
      <select className="move" value={ this.props.index } onChange={ this._move.bind(this) }>
        { this._sortOptions() }
      </select>
    );
  }

  _sortOptions() {
    const r = [];
    _.times(this.props.total, (n) => {
      r.push(<option key={ n } value={ n }>{ n + 1 }</option>);
    });
    return r;
  }

  render() {
    return (
      <li>
        <img width="240"
             height="160"
             src={ this._src() }
        />
        <span className="dimensions">{ this.props.original_size }</span>
        <div>
          { this._deleteButton() } Position: { this._sortSelect() } { this._download() }
        </div>
      </li>
    );
  }
}

Image.defaultProps = {
  type: "list",
  bucket: null,
  baseURL: 'https://storage.googleapis.com',
};

Image.propTypes = {
  type: React.PropTypes.string,
  bucket: React.PropTypes.string,
  baseURL: React.PropTypes.string,
  index: React.PropTypes.number,
  total: React.PropTypes.number,
  original_size: React.PropTypes.string,
  albumID: React.PropTypes.string,
  id: React.PropTypes.string,
  delete: React.PropTypes.func,
  move: React.PropTypes.func,
};

export default Image;
