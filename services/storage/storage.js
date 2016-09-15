module.exports = (apis) => {
  const bucket = process.env.SF_GCS_BUCKET;

  return (name)  => {
    const file = apis.gcs.bucket(bucket).file(name);

    return {
      metadata: (cb) => {
        file.getMetadata(cb)
      },

      store: (data, headers, cb) => {
        const metadata = {
          contentType: headers['content-type'],
          cacheControl: headers['cache-control'],
        };

        if (headers) {
          metadata.metadata = {};
          for (const key of Object.keys(headers)) {
            if (key.match(/^pb-/i)) {
              metadata.metadata[key] = headers[key];
            }
          }
        }

        const writer = file.createWriteStream(
          { metadata: metadata }
        )
          .on('error', (err) => {
            return cb(err);
          })
          .on('finish', () => {
            file.makePublic((err, res) => {
              const location = `https://storage.googleapis.com/${bucket}/${name}`;
              return cb(err, location);
            });
          });
        writer.write(data);
        writer.end();
      },

      download: (cb) => {
        file.download(cb)
      },
    };
  }
};
