'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const dataset = require('./test_dataset');

describe.only('GCloud Datastore Model Events', () => {
  let sandbox;
  let TestModel;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(dataset, 'get', (key, callback) => {
      callback(null, {key, data: {_metadata: {}}});
    });

    sandbox.stub(dataset, 'save', (entity, callback) =>
      callback(entity.key.path[0] === 'Error' ? new Error() : null));

    TestModel = require('../')(dataset);
  });

  afterEach(() => sandbox.restore());

  describe('inserted', () => {
    let onInsertedEventSpy;
    let insertedModel;

    beforeEach(() => {
      onInsertedEventSpy = sandbox.spy();
      TestModel.on('inserted', onInsertedEventSpy);
    });

    describe('when insert succeeds', () => {
      beforeEach(() =>
        TestModel.insert(dataset.key('Thing', '1'), {test: 'value'}).then(model => insertedModel = model));

      it('raises the event', () => {
        sinon.assert.calledOnce(onInsertedEventSpy);
      });

      it('sends the model as the only event argument', () => {
        expect(onInsertedEventSpy.firstCall.args).to.deep.equal([insertedModel]);
      });
    });

    describe('when insert fails', () => {
      beforeEach(() =>
        TestModel.insert(dataset.key('Error', '1'), {test: 'value'})
          .catch(() => null));

      it('does not raise the event', () => {
        sinon.assert.notCalled(onInsertedEventSpy);
      });
    });
  });

  describe('updated', () => {
    let onUpdatedEventSpy;
    let updatedModel;

    beforeEach(() => {
      onUpdatedEventSpy = sandbox.spy();
      TestModel.on('updated', onUpdatedEventSpy);
    });

    describe('when update succeeds', () => {
      beforeEach(() =>
        TestModel.update(dataset.key('Thing', '1'), {test: 'value'}).then(model => updatedModel = model));

      it('raises the event', () => {
        sinon.assert.calledOnce(onUpdatedEventSpy);
      });

      it('sends the model as the only event argument', () => {
        expect(onUpdatedEventSpy.firstCall.args).to.deep.equal([updatedModel]);
      });
    });

    describe('when update fails', () => {
      beforeEach(() =>
        TestModel.update(dataset.key('Error', '1'), {test: 'value'})
          .catch(() => null));

      it('does not raise the event', () => {
        sinon.assert.notCalled(onUpdatedEventSpy);
      });
    });
  });
});
