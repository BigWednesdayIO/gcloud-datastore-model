'use strict';

const dataset = require('./test_dataset');

beforeEach(() => {
  const query = dataset.createQuery('Kind');

  return new Promise((resolve, reject) => {
    dataset.runQuery(query, (err, res) => {
      if (err) {
        console.error(`Error getting keys of old test data to delete`, err);

        return reject(err);
      }

      dataset.delete(res.map(r => r.key), err => {
        if (err) {
          console.error(`Error deleting test data`, err);
          return reject(err);
        }

        resolve();
      });
    });
  });
});
