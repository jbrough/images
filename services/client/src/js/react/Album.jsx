'use strict';

import Image from './Image.jsx';
import FileForm from './FileForm.jsx';
import Overlay from './Overlay.jsx';

import React from 'react';

import async from 'async';

class Album extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      status: 'Loading...',
      error: false,
      images: [],
      verified: false,
      name: undefined,
    };
  }

  componentDidMount() {
    this._loadData();
  }

  error() {
    this.setState({ status: 'Error' });
  }

  _parseImagesResponse(data) {
    return data.map((d) => {
      if (!d || !d.name || !d.metadata) {
        return this.error();
      }

      return {
        id: d.name.replace('list_', '').replace('.jpg', ''),
        bucket: d.bucket,
        original_size: d.metadata['sf-original-size'],
      };
    });
  }

  _loadData() {
    async.parallel({
      images: (cb) => {
        this.props.request('get', `/api/album/${this.props.id}`, null, cb);
      },
    }, (err, res) => {
      if (err) { return this.error(); }

      const images = this._parseImagesResponse(res.images.body);

      this.setState({
        loading: false,
        status: '',
        images,
        name,
      });
    });
  }

  preRequest() {
    this.setState({
      loading: true,
      status: 'Uploading...',
    });
  }

  responseErrHandler(cb) {
    return (err, res) => {
      if (err) {
        this.error();
        return cb(err);
      }

      this.setState({
        loading: false,
      }, cb);
    };
  }

  responseHandler(cb) {
    return (err, res) => {
      if (err) {
        this.error();
        return cb(err);
      }

      this.setState({
        images: this._parseImagesResponse(res.body),
        loading: false,
      }, cb);

      return undefined;
    };
  }

  addImage(buf, cb) {
    this.setLoading();
    this.props.request(
      'post', `/api/album/${this.props.id}/image/add`, buf, this.responseHandler(cb)
    );
  }

  deleteImage(imageID) {
    this.setLoading();
    this.props.request(
      'delete', `/api/album/${this.props.id}/image/${imageID}`, null, this.responseHandler(() => {})
    );
  }

  moveImage(imageID, index) {
    this.setLoading();
    this.props.request(
      'post', `/api/album/${this.props.id}/image/${imageID}/move/${index}`, null, this.responseHandler(() => {})
    );
  }

  setLoading() {
    this.setState({
      loading: true,
      status: 'Loading...',
    });
  }

  _setStatus(type, id) {
    const state = this.state[type];
    state[id] = true;
    const newState = {};
    newState[type] = state;
    this.setState(newState);
  }

  renderFileForm() {
    return (
      <FileForm addImage={ this.addImage.bind(this) }
                setLoading={ this.setLoading.bind(this) }
                error={ this.error.bind(this) }
      />
    );
  }

  renderImages() {
    return this.state.images.map((img, i) => {
      return (
        <Image id={ img.id }
               albumID={ this.props.id }
               bucket={ img.bucket }
               key={ i }
               index={ i }
               total={ this.state.images.length }
               original_size={ img.original_size }
               delete={ this.deleteImage.bind(this) }
               move={ this.moveImage.bind(this) }
        />
      );
    });
  }

  _deleteImages() {
    if (this._confirmDialogue("This will delete all images in this album -- are you sure?")) {
      this.setLoading();
      this.props.request(
        'delete', `/api/album/${this.props.id}`, null, this.responseHandler(() => {})
      );
    }
  }

  _reprocessImages() {
    if (this._confirmDialogue("Images will be reprocessed in the background.")) {
      this.setLoading();
      this.props.request(
        'post', `/api/album/${this.props.id}/reprocess?priority=1`, null, this.responseErrHandler(() => {})
      );
    }
  }

  _confirmDialogue(msg) {
    if (typeof confirm === 'undefined') return true; // skip this step in tests

    return confirm(msg);
  }

  render() {
    return (
      <div>
        <h4>{ this.state.name }</h4>
        <div className="ctrls">
          { this.renderFileForm() }
          <input className="button"
                 type="submit"
                 value="Delete All"
                 onClick={ this._deleteImages.bind(this) }/>
          <input className="button"
                 type="submit"
                 value="Reprocess All"
                 onClick={ this._reprocessImages.bind(this) }/>
        </div>
        <ol>
          { this.renderImages() }
        </ol>
        <Overlay loading={ this.state.loading }
                 status={ this.state.status }
        />
      </div>
    );
  }
}

Album.propTypes = {
  request: React.PropTypes.func,
  id: React.PropTypes.string,
};

export default Album;
