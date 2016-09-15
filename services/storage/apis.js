const gcloud = require('google-cloud');

module.exports = () => {
  const projectId = process.env.SF_GOOGLE_PROJECT_ID;

  const storage = require('@google-cloud/storage')

  return {
    gcs: gcloud.storage({ projectId }),
  };
};
