'use strict';

const events = require('events');

const _ = require('lodash');

class EntityNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EntityNotFoundError';
  }
}

const flattenMetadata = entity => {
  const flattened = {};

  _.forOwn(entity._metadata, (value, key) => {
    flattened[`_metadata_${key}`] = value;
  });

  return Object.assign(flattened, _.omit(entity, '_metadata'));
};

const expandMetadata = entity =>
  _.transform(entity, (accum, value, key) => {
    if (key.startsWith('_metadata_')) {
      accum._metadata[key.replace('_metadata_', '')] = value;
    } else {
      accum[key] = value;
    }
    return accum;
  }, {_metadata: {}});

const save = (dataset, key, entity, method) => {
  const storedEntity = flattenMetadata(entity);

  return new Promise((resolve, reject) => {
    dataset.save({key, method, data: storedEntity}, err => {
      if (err) {
        return reject(err);
      }

      resolve(Object.assign({id: _.last(key.path)}, entity));
    });
  });
};

class Model extends events.EventEmitter {
  constructor(dataset) {
    super();
    this._dataset = dataset;
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this._dataset.get(key, (err, retrievedEntity) => {
        if (err) {
          return reject(err);
        }

        if (!retrievedEntity) {
          return reject(new EntityNotFoundError());
        }

        const entity = expandMetadata(retrievedEntity.data);
        entity.id = _.last(retrievedEntity.key.path);
        resolve(entity);
      });
    });
  }

  getMany(keys) {
    return new Promise((resolve, reject) => {
      this._dataset.get(keys, (err, retrievedEntities) => {
        if (err) {
          return reject(err);
        }

        resolve(retrievedEntities.map(e => {
          const entity = expandMetadata(e.data);
          entity.id = _.last(e.key.path);
          return entity;
        }));
      });
    });
  }

  insert(key, entity) {
    const date = new Date();
    return save(this._dataset, key, Object.assign({_metadata: {created: date, updated: date}}, entity), 'insert')
      .then(model => {
        this.emit('inserted', model, key);
        return model;
      });
  }

  update(key, entity) {
    return this.get(key)
      .then(currentEntity => {
        const updatedEntity = Object.assign({_metadata: currentEntity._metadata}, entity);
        updatedEntity._metadata.updated = new Date();
        return save(this._dataset, key, updatedEntity, 'update');
      })
      .then(model => {
        this.emit('updated', model, key);
        return model;
      });
  }

  find(query) {
    return new Promise((resolve, reject) => {
      this._dataset.runQuery(query, (err, results) => {
        if (err) {
          return reject(err);
        }

        resolve(results.map(r => {
          const entity = expandMetadata(r.data);
          entity.id = _.last(r.key.path);

          Object.defineProperty(entity, '_key', {value: r.key});

          return entity;
        }));
      });
    });
  }

  delete(key) {
    return new Promise((resolve, reject) => {
      this._dataset.delete(key, (err, result) => {
        if (err) {
          return reject(err);
        }

        if (result.mutation_result.index_updates === 0) {
          return reject(new EntityNotFoundError());
        }

        resolve();
      });
    })
    .then(() => {
      this.emit('deleted', key);
      return;
    });
  }
}

module.exports = dataset => new Model(dataset);
