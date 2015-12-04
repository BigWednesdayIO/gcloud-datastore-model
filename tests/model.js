'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const sinon = require('sinon');

const dataset = require('./test_dataset');

describe('GCloud Datastore Model', function () {
  const key = dataset.key(['Kind', 'myid']);
  const model = {one: 'two', two: 'three'};
  const generatedFields = ['_metadata', 'id'];

  let sandbox;
  let saveSpy;
  let runQuerySpy;
  let deleteSpy;
  let TestModel;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    saveSpy = sandbox.spy(dataset, 'save');
    runQuerySpy = sandbox.spy(dataset, 'runQuery');
    deleteSpy = sandbox.spy(dataset, 'delete');

    TestModel = require('../')(dataset);
  });

  afterEach(() => sandbox.restore());

  describe('insert', () => {
    let returnedModel;
    const stubbedDate = new Date();

    beforeEach(() => {
      sandbox.useFakeTimers(stubbedDate.getTime());
      return TestModel.insert(key, model).then(m => returnedModel = m);
    });

    it('persists against the key', () => {
      sinon.assert.calledWith(saveSpy, sinon.match({key}));
    });

    it('persists the model attributes', () => {
      sinon.assert.calledWith(saveSpy, sinon.match({data: model}));
    });

    it('persists created date metadata', () => {
      sinon.assert.calledWith(saveSpy, sinon.match(value => value.data._metadata_created.getTime() === stubbedDate.getTime(),
        'created date'));
    });

    it('persists updated date metadata', () => {
      sinon.assert.calledWith(saveSpy, sinon.match(value => value.data._metadata_updated.getTime() === stubbedDate.getTime(),
        'updated date'));
    });

    it('returns the model with it\'s id set', () => {
      expect(returnedModel).to.have.property('id', 'myid');
    });

    it('returns the model created date', () => {
      expect(returnedModel).to.have.property('_metadata');
      expect(returnedModel._metadata.created).to.deep.equal(stubbedDate);
    });

    it('returns the model updated date', () => {
      expect(returnedModel).to.have.property('_metadata');
      expect(returnedModel._metadata.updated).to.deep.equal(stubbedDate);
    });

    it('returns the model attributes', () => {
      const generatedFields = ['_metadata', 'id'];
      expect(_.omit(returnedModel, generatedFields)).to.deep.equal(model);
    });
  });

  describe('update', () => {
    const modelUpdate = {a: 'b', c: 'd'};
    let insertedModel;
    let updatedModel;

    beforeEach(() =>
      TestModel.insert(key, model)
        .then(m => insertedModel = m)
        .then(() => TestModel.update(key, modelUpdate))
        .then(m => updatedModel = m));

    it('persists against the key', () => {
      sinon.assert.calledWith(saveSpy, sinon.match({key}));
    });

    it('persists the updated model attributes', () => {
      sinon.assert.calledWith(saveSpy, sinon.match({data: modelUpdate}));
    });

    it('persists created date metadata', () => {
      sinon.assert.calledWith(saveSpy, sinon.match(
        value => value.data._metadata_created.getTime() === insertedModel._metadata.created.getTime(), 'created date'));
    });

    it('persists updated date metadata', () => {
      // cannot stub time due to sinon fake timers issue, so only testing that the date has changed from the insert
      // https://github.com/sinonjs/sinon/issues/738
      sinon.assert.calledWith(saveSpy, sinon.match(
        value => value.data._metadata_updated.getTime() > insertedModel._metadata.updated.getTime(), 'updated date'));
    });

    it('returns the model with it\'s id set', () => {
      expect(updatedModel).to.have.property('id', 'myid');
    });

    it('returns the model created date', () => {
      expect(updatedModel).to.have.property('_metadata');
      expect(updatedModel._metadata.created).to.deep.equal(insertedModel._metadata.created);
    });

    it('returns the model updated date', () => {
      // cannot stub time due to sinon fake timers issue, so only testing that the date has changed from the insert
      // https://github.com/sinonjs/sinon/issues/738
      expect(updatedModel).to.have.property('_metadata');
      expect(updatedModel._metadata.updated.toISOString()).to.be.above(insertedModel._metadata.updated.toISOString());
    });

    it('returns the model attributes', () => {
      const generatedFields = ['_metadata', 'id'];
      expect(_.omit(updatedModel, generatedFields)).to.deep.equal(modelUpdate);
    });

    it('throws EntityNotFoundError for updating non-existant model', () =>
      TestModel.update(dataset.key(['Kind', 'notexists']), {some: 'fields'})
        .then(() => {
          throw new Error('Expected EntityNotFoundError');
        }, err => {
          expect(err).to.be.an('error');
          expect(err).to.have.property('name', 'EntityNotFoundError');
        }));
  });

  describe('get', () => {
    let returnedModel;
    let insertedModel;

    beforeEach(() =>
      TestModel.insert(key, model)
        .then(m => insertedModel = m)
        .then(() => TestModel.get(key))
        .then(m => returnedModel = m));

    it('returns the model with it\'s id set', () => {
      expect(returnedModel).to.have.property('id', 'myid');
    });

    it('returns the model created date', () => {
      expect(returnedModel).to.have.property('_metadata');
      expect(returnedModel._metadata.created).to.deep.equal(insertedModel._metadata.created);
    });

    it('returns the model updated date', () => {
      expect(returnedModel).to.have.property('_metadata');
      expect(returnedModel._metadata.updated).to.deep.equal(insertedModel._metadata.updated);
    });

    it('returns the model attributes', () => {
      expect(_.omit(returnedModel, generatedFields)).to.deep.equal(model);
    });

    it('throws EntityNotFoundError for getting non-existant model', () =>
      TestModel.get(dataset.key(['Kind', 'notexists']))
        .then(() => {
          throw new Error('Expected EntityNotFoundError');
        }, err => {
          expect(err).to.be.an('error');
          expect(err).to.have.property('name', 'EntityNotFoundError');
        }));
  });

  describe('getMany', () => {
    let returnedModels;
    let insertedModels;
    const key2 = dataset.key(['Kind', 'other']);

    beforeEach(() =>
      Promise.all([
        TestModel.insert(key, model),
        TestModel.insert(key2, model)
      ])
      .then(m => insertedModels = m)
      .then(() => TestModel.getMany([key, key2]))
      .then(m => returnedModels = m));

    it('returns the models with their ids', () => {
      expect(_.pluck(returnedModels, 'id')).to.deep.equal(['myid', 'other']);
    });

    it('returns the models with created dates', () => {
      returnedModels.forEach((model, index) => {
        expect(model).to.have.property('_metadata');
        expect(model._metadata.created).to.deep.equal(insertedModels[index]._metadata.created);
      });
    });

    it('returns the models with updated dates', () => {
      returnedModels.forEach((model, index) => {
        expect(model).to.have.property('_metadata');
        expect(model._metadata.updated).to.deep.equal(insertedModels[index]._metadata.updated);
      });
    });

    it('returns the model\'s attributes', () => {
      returnedModels.forEach((model, index) => {
        expect(_.omit(model, generatedFields)).to.deep.equal(_.omit(insertedModels[index], generatedFields));
      });
    });

    it('ignores non existant keys', () =>
      TestModel.getMany([key, dataset.key(['Kind', 'notexists'])])
        .then(models => expect(models).to.have.length(1)));
  });

  describe('find', () => {
    const query = dataset.createQuery('Kind').order('field');
    let foundModels;

    beforeEach(() =>
      Promise.all([
        TestModel.insert(dataset.key(['Kind', '1']), {field: 1, other: 3}),
        TestModel.insert(dataset.key(['Kind', '2']), {field: 2, other: 2}),
        TestModel.insert(dataset.key(['Kind', '3']), {field: 3, other: 1})
      ])
      .then(() => TestModel.find(query))
      .then(m => foundModels = m));

    it('runs the query', () => {
      sinon.assert.calledWith(runQuerySpy, query);
    });

    it('returns the right number of results', () => {
      expect(foundModels).to.have.length(3);
    });

    it('returns models with ids', () => {
      expect(_.pluck(foundModels, 'id')).to.deep.equal(['1', '2', '3']);
    });

    it('returns models with created dates', () => {
      foundModels.forEach(model => {
        expect(model).to.have.property('_metadata');
        expect(model._metadata.created).to.be.a('date');
      });
    });

    it('returns models with updated dates', () => {
      foundModels.forEach(model => {
        expect(model).to.have.property('_metadata');
        expect(model._metadata.updated).to.be.a('date');
      });
    });

    it('returns the model attributes', () => {
      foundModels.forEach((model, index) => {
        expect(_.omit(model, generatedFields)).to.deep.equal({field: index + 1, other: 3 - index});
      });
    });
  });

  describe('delete', () => {
    let deleteResponse;

    beforeEach(() =>
      TestModel.insert(key, model)
        .then(() => TestModel.delete(key))
        .then(response => deleteResponse = response));

    it('deletes the entity matching the key', () => {
      sinon.assert.calledWith(deleteSpy, key);
    });

    it('returns nothing', () => {
      expect(deleteResponse).to.not.exist;
    });

    it('throws EntityNotFoundError for deleting non-existant model', () =>
      TestModel.delete(dataset.key(['Kind', 'notexists']))
        .then(() => {
          throw new Error('Expected EntityNotFoundError');
        }, err => {
          expect(err).to.be.an('error');
          expect(err).to.have.property('name', 'EntityNotFoundError');
        }));
  });
});
