# gcloud-datastore-model
A wrapper around gcloud dataset for storing, retrieving and basic querying of entities

### Development

The tests in this module use the [gcd tool](https://cloud.google.com/datastore/docs/tools/) to test against a local Google Cloud Datastore. [Install Docker compose](https://docs.docker.com/compose/install/) and run `docker-compose up dev` from the code directory to start gcd and a file watcher that will automatically run the tests when making code changes.
