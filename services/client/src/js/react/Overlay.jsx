import React from 'react';

class Overlay extends React.Component {
  render() {
    let ret;
    if (this.props.loading) {
      ret = (
        <div className="progress progress-1s is-visible">
          <div className="progress-bar">
            <p>{ this.props.status }</p>
          </div>
        </div>
      );
    } else {
      ret = <div></div>;
    }

    return ret;
  }
}

Overlay.propTypes = {
  loading: React.PropTypes.bool,
  status: React.PropTypes.string,
};

export default Overlay;
