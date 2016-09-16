const gcloud = require('google-cloud');
const pkgcloud = require('pkgcloud');

module.exports = () => {
  const projectId = process.env.SF_GOOGLE_PROJECT_ID;
  const apiKey = process.env.SF_PKGCLOUD_STORAGE_API_KEY;

  const storage = require('@google-cloud/storage')

  const client = pkgcloud.storage.createClient({
    provider: 'rackspace',
    username: 'jamie.brough',
    apiKey,
    region: 'LON',
    useInternal: false,
  });

  return {
    gcs: gcloud.storage({ projectId }),
    pkgcloud: client,
  };
};
