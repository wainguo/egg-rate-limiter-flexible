'use strict';
const ms = require('ms');
const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible');
// insuranceLimiter 是 RateLimiterRes 对象
const insuranceLimiter = new RateLimiterMemory({
  points: 10000, // Maximum number of points can be consumed over duration
  duration: 1, // Per second
});

const debug = require('debug')('egg-ratelimiter-flexible');
module.exports = {
  async isRateLimited(opts = {}) {
    let rateLimited = false;

    const ctx = this;
    const { remaining = 'X-RateLimit-Remaining', reset = 'X-RateLimit-Reset', limit = 'X-RateLimit-Limit' } = ctx.app.config.rateLimiterFlexible.headers || {};
    // 通过ips获取 nginx代理层真实IP，需要配置 config.proxy = true;
    const ips = ctx.ips.length > 0 ? ctx.ips[0] !== '127.0.0.1' ? ctx.ips[0] : ctx.ips[1] : ctx.ip;
    const opt = opts; // 请求路径['/']
    opt.duration = ms(opt.time) / 1000;
    opt.points = opt.max;
    const id = ips;
    if (id == null) {
      return false;
    }

    const mongoose = this.app.mongoose;
    const mongoConn = mongoose.connection;
    const options = Object.assign({}, {
      storeClient: mongoConn,
      points: 10000, // Number of points
      duration: 1, // Per second(s) so default `execEvenlyMinDelayMs` is 100ms
      insuranceLimiter,
    }, opt);
    debug('ctx: rate limiter options %j', options);
    const rateLimiterMongo = new RateLimiterMongo(options);
    let rateLimiterRes = {};
    try {
      rateLimiterRes = await rateLimiterMongo.consume(this.path, 1);
      rateLimited = false;
    } catch (e) {
      rateLimiterRes = e;
      rateLimited = true;
    }

    // 给客户端一些详细信息
    const headers = {
      'Retry-After': rateLimiterRes.msBeforeNext / 1000,
      [limit]: opts.points,
      [remaining]: rateLimiterRes.remainingPoints,
      [reset]: new Date(Date.now() + rateLimiterRes.msBeforeNext),
    };
    ctx.set(headers);

    // const after = (rateLimiterRes.msBeforeNext / 1000) || 0;
    // ctx.set('Retry-After', after);

    debug('remaining %s/%s %s', rateLimiterRes.remainingPoints, opts.points, id);

    // ctx.status = 429;
    return rateLimited;
  },
};
