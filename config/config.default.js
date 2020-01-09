'use strict';

/**
 * egg-rate-limiter-flexible default config
 * @member Config#rateLimiterFlexible
 * @property {String} SOME_KEY - some description
 */
exports.rateLimiterFlexible = {
  app: true,
  headers: {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    limit: 'X-RateLimit-Limit',
  },
};
