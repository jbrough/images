module.exports = (apis) => {
  return function resize(buf, dims, cb) {
    apis.sharp(buf).metadata((err, metadata) => {
      if (err) return cb(err);

      if (dims == null) {
        dims = { w: metadata.width, h: metadata.height };
      }

      apis.sharp(buf)
      .resize(dims.w, dims.h)
      .crop(apis.sharp.gravity.center)
      .jpeg(90)
      .toBuffer((err, outBuf) => {
        if (err) return cb(err);

        return cb(null, outBuf, `${metadata.width}x${metadata.height}`);
      });
    });
  };
};
