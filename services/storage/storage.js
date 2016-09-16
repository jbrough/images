const fs = require('fs');
const streamBuffers = require('stream-buffers');

module.exports = (apis) => {
  //const bucket = process.env.SF_GCS_BUCKET;
  const bucket = 'test-images';

  const client = apis.pkgcloud;

  function getFile(name, cb) {
    apis.pkgcloud.getFile(bucket, name, cb)
  }

  return (name)  => {

    return {
      metadata: (cb) => {
        file.getMetadata(cb)
      },

      store: (data, headers, cb) => {
        const size = Buffer.byteLength(data.toString());

        const opts = {
          container: bucket,
          remote: name,
          contentType: headers['content-type'],
          size,
        };

        console.log(opts);

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

        const reader = new streamBuffers.ReadableStreamBuffer({
          frequency: 10,
          chunkSize: 2048,
        });

        reader.put(data);

        const writer = client.upload(
          opts
        )
        writer
        .on('error', (err) => {
          return cb(err);
        })
        .on('success', (file) => {
          return cb(null, file);
        });

        reader.pipe(writer);
      },

      download: (cb) => {
        file.download(cb)
      },
    };
  }
};
