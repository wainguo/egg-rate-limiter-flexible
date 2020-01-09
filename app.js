'use strict';
module.exports = app => {
  // 调用中间件
  if (app.config.rateLimiterFlexible.app) {
    app.config.coreMiddleware.unshift('rateLimiterFlexible');
  }
};
