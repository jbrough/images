'use strict';

import React from 'react';
import async from 'async';

class FileForm extends React.Component {
  handleSubmit(e) {
    e.preventDefault();
  }

  handleFiles(e) {
    async.eachSeries(
      e.target.files,
      (file, callback) => {
        this.props.setLoading();
        const reader = new FileReader();
        reader.onload = (upload) => {
          const buf = upload.target.result;

          this.props.addImage(buf, callback);
        };

        reader.readAsArrayBuffer(file);
      },
      (err) => { if (err) this.props.error(); }
    );
  }

  render() {
    return (
      <form onSubmit={ this.handleSubmit.bind(this) } encType="multipart/form-data">
        <input type="file" className="upload" onChange={ this.handleFiles.bind(this) } multiple />
      </form>
    );
  }
}

FileForm.propTypes = {
  setLoading: React.PropTypes.func,
  addImage: React.PropTypes.func,
  error: React.PropTypes.func,
};

export default FileForm;
