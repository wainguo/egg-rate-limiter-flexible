# egg-rate-limiter-flexible

- 基于rate-limiter-flexible，采用mongodb的流量控制
- 支持egg [js] 
- 支持Controller控制器内分别配置请求速率限制

## Install

```bash
$ npm i egg-rate-limiter-flexible --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.rateLimiterFlexible = {
  enable: true,
  package: 'egg-rate-limiter-flexible',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.rateLimiterFlexible = {
  router: [
    {
      path: '/', // 限制路由路径 此规则不会匹配(index.html?id=1)[http://url/index.html?id=1]
      max: 5,
      time: '7s', // 时间单位 s m h d y ...
      status: 209, // http 响应状态码
      message: 'Custom request overrun error message'//自定义请求超限错误信息
    },
    {
      path: '/api',
      max: 5,
      time: '7s', //时间单位 s m h d y ...
      message: 'Custom request overrun error message'//自定义请求超限错误信息
    }
  ]
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

Configure ratelimiter information in `${app_root}/app/controller/home.js`:

**Controller**

```javascript
export class HomeController {

  async index(ctx) {
    const { ctx, service } = this;

    // 超出速率限制返回判断
    // [true]为超出速率限制   [false]则继续向下执行
    // js返回方法为 ctx.body = 'message'
    if (await ctx.isRateLimited({ max: 5, time: '5s' })) {
       ctx.body = 'Rate limit exceeded'
    }

    //...
    //业务逻辑
    //...

    // 正常返回
    ctx.body = 'success'
  }
}

```

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
