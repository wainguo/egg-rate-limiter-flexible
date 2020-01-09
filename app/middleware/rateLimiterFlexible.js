'use strict';
const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible');

const ms = require('ms');
const debug = require('debug')('egg-rate-limiter-flexible');

module.exports = (opts = {}) => {
  const { remaining = 'X-RateLimit-Remaining', reset = 'X-RateLimit-Reset', limit = 'X-RateLimit-Limit' } = opts.headers || {};
  const actionKeys = [];
  opts.router.forEach(item => actionKeys.push(item.path));
  return async (ctx, next) => {
    // 如果没有限制配置，则直接返回
    if (actionKeys.length === 0) {
      return await next();
    }
    // 如果当前访问URL 路径不在actionKeys中 则直接返回
    if (actionKeys.indexOf(ctx.url) === -1) {
      return await next();
    }
    // 通过ips获取 nginx代理层真实IP，需要配置 config.proxy = true;
    const ips = ctx.ips.length > 0 ? ctx.ips[0] !== '127.0.0.1' ? ctx.ips[0] : ctx.ips[1] : ctx.ip;
    const opt = opts.router[actionKeys.indexOf(ctx.url)]; // 请求路径['/']
    opt.duration = ms(opt.time) / 1000;
    opt.points = opt.max;

    const id = ips;
    if (id == null) {
      return await next();
    }

    const mongoose = ctx.app.mongoose;
    const mongoConn = mongoose.connection;
    // insuranceLimiter 是 RateLimiterRes 对象
    const insuranceLimiter = new RateLimiterMemory({
      points: 10000, // Maximum number of points can be consumed over duration
      duration: 1, // Per second
    });
    const options = Object.assign({}, {
      storeClient: mongoConn,
      points: 10000, // Number of points
      duration: 1, // Per second(s) so default `execEvenlyMinDelayMs` is 100ms
      insuranceLimiter,
    }, opt);

    const rateLimiterMongo = new RateLimiterMongo(options);
    let rateLimiterRes = {};
    let rateLimited = false;
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
    debug('remaining %s/%s %s', rateLimiterRes.remainingPoints, options.points, id);

    if (!rateLimited) {
      return await next();
    }
    // const delta = (limit.reset * 1000 - Date.now()) | 0;
    // const after = (limit.reset - Date.now() / 1000) | 0;
    // ctx.set('Retry-After', after);
    const delta = rateLimiterRes.msBeforeNext;
    ctx.status = opt.status || 429;
    ctx.body = opt.message || `Rate limit exceeded, retry in ${ms(delta, { long: true })}.`;
    if (opts.throw) {
      ctx.throw(ctx.status, ctx.body, {
        headers,
      });
    }
  };
};
