# gcloud-datastore-model
[![Circle CI](https://circleci.com/gh/BigWednesdayIO/gcloud-datastore-model/tree/master.svg?style=svg&circle-token=14876e77d4fbc2fc78348ae593151218549cb9cb)](https://circleci.com/gh/BigWednesdayIO/gcloud-datastore-model/tree/master)

A wrapper around the [gcloud-node](https://github.com/GoogleCloudPlatform/gcloud-node) dataset functions for storing, retrieving and basic querying of Google Cloud Datastore entities.

### Features

* Created and updated dates stored and returned in _metadata properties
* Assigns an id to the model based on the datastore key
* Returns promises
* Raises events

### Install

`npm install gcloud-datastore-model --save`

### Usage

```
const dataset = require('gcloud').datastore.dataset({
  projectId: 'my-project',
  credentials: {}
});

const DatastoreModel = require('gcloud-datastore-model')(dataset);

DatastoreModel.insert(dataset.key(['Kind', 'myid']), {test: 'value'})
  .then(model => console.log);

DatastoreModel.on('inserted', model => console.log);

/* model:
{
  id: 'myid',
  test: 'value',
  _metadata: {
    created: Thu Dec 03 2015 16:04:05 GMT+0000 (GMT)
    updated: Thu Dec 03 2015 16:04:05 GMT+0000 (GMT)
  }
}
*/
```

### API

All functions return promises.

* insert(key, model) - inserts a new model into the datastore. Errors when key already exists.
* update(key, model) - updates an existing model in the datastore. Errors with an EntityNotFoundError if the key does not exist.
* get(key) - retrieves a model from the datastore. Errors with an EntityNotFoundError if the key does not exist.
* getMany(keys) - retrieves multiple models from the datastore. Ignores keys that do not exist.
* delete(key) - deletes a model from the datastore. Errors with an EntityNotFoundError if the key does not exist.
* find(query) - executes a datastore query.

Parameters:

* key - A gcloud-node dataset key object e.g. dataset.key(['Person', '1'])
* model - Attributes to persist to datastore e.g. {firstname: 'John', lastname: 'Smith', age: 30}

Events:

* on('inserted', (model, key) => {}) - emitted when a new model is successfully inserted
* on('updated', (model, key) => {}) - emitted when an existing model is successfully updated
* on('deleted', key => {}) - emitted when an existing model is successfully deleted

### Development

The tests in this module use the [gcd tool](https://cloud.google.com/datastore/docs/tools/) to test against a local Google Cloud Datastore. [Install Docker compose](https://docs.docker.com/compose/install/) and run `docker-compose up dev` from the code directory to start gcd and a file watcher that will automatically run the tests when making code changes.
