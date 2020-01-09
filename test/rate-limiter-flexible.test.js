'use strict';

const mock = require('egg-mock');

describe('test/rate-limiter-flexible.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/rate-limiter-flexible-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, rateLimiterFlexible')
      .expect(200);
  });
});
