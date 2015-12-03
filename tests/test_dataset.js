'use strict';

module.exports = require('gcloud').datastore.dataset({
  projectId: 'test',
  credentials: {
    private_key_id: '12345',
    private_key: '-----BEGIN PRIVATE KEY-----\n123456789\n-----END PRIVATE KEY-----\n',
    client_email: '123.developer.gserviceaccount.com',
    client_id: '123.apps.googleusercontent.com',
    type: 'service_account'
  }
});
