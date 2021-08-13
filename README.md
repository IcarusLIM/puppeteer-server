# Puppeteer server

基于 puppeteer，执行用户定义脚本，为获取定向抓取的 token/cookie 获取设计

## 脚本格式

脚本执行环境为 nodejs，包装到 async Function 中执行，参考 [AsyncFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction)

脚本可访问的变量说明：

- url: 与请求中的 url 对应，详见 接口格式
- page: puppeteer 的 page 对象，通过`await browser.newPage()`创建
- addHeader(key, value): 预定义函数，添加一组 header 到返回值
- setCookie(cookie): 预定义函数，设置返回值中的 cookies 字段

原理示意（具体实现详见 handler.js）

```js
async (url) => {
  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch();
  const page = await ctx.newPage();

  const res = {};
  function addHeader(key, value) {
    if (!res.headers) {
      res.headers = {};
    }
    res.headers[key] = value;
  }
  function setCookie(cookieStr) {
    res.cookies = cookieStr;
  }

  const userDefindFunction = async (url, page, params) => {
    const { addHeader, setCookie } = params;
    // write your script here
    // user defined script
  };

  return Object.assign(
    res,
    await userDefindFunction(url, page, { addHeader, setCookie })
  );
};
```

> 请勿在脚本中添加`function(url, page, { addHeader, setCookie }){`和`}`这样的方法首围字符串，仅编写函数体文本即可

## 接口及示例

### 自定义脚本

#### 接口格式

- POST `/exec`

  body

  ```json
  {
    "url": "", //可选，若给定则在script中可通过url访问到
    "script": "", //需要执行的js脚本
    "proxy": "", //代理地址，可选，下同
    "userAgent": "" //UA，可选，下同
  }
  ```

  接口返回取决于 script 内容，如：

  ```json
  {
    "script": "addHeader('k', 'v'); setCookie('c:cv'); return {test: 'test'}"
  }
  ```

  返回：

  ```json
  {
    "headers": {
      "k": "v"
    },
    "cookies": {},
    "test": "test"
  }
  ```

#### 示例

以热云 http://39.104.98.139/#/ 登录为例，script 脚本：

```js
const url = "http://39.104.98.139/#/",
  userName = "xxx",
  password = "xxx",
  userNameInput = "div.infoBox > ul > li:nth-child(1) > input[type=text]", //用户名输入框的css selector
  passwordInput = "div.infoBox > ul > li:nth-child(2) > input[type=password]", //密码输入框的css selector
  loginBtn = "div.loginInfo > div.infoBox > div.login_btn", //登录按钮的css selector
  successUrlPerfix = "http://39.104.98.139/adi/api/user/userMediaList";

// goto login page
await page.goto(url);

// set username and password
await page.evaluate(
  async (userName, password, userNameInput, passwordInput, opDelay) => {
    const sleep = (t) => new Promise((r) => setTimeout(r, t));

    const elemUN = document.querySelector(userNameInput);
    elemUN.value = userName;
    elemUN.dispatchEvent(new Event("input"));
    await sleep(opDelay);

    const elemPS = document.querySelector(passwordInput);
    elemPS.value = password;
    elemPS.dispatchEvent(new Event("input"));
    await sleep(opDelay);
  },
  userName,
  password,
  userNameInput,
  passwordInput,
  opDelay
);

// do login
const waitPromise = page.waitForResponse((resp) => {
  const req = resp.request();
  return (
    decodeURI(req.url()).startsWith(successUrlPerfix) && resp.status() === 200
  );
}, 10000);
await page.click(loginBtn);
const successResp = await waitPromise;
const headers = successResp.request().headers();

return { headers: { authorization: headers.authorization } };
```

将返回

```json
{
  "headers": {
    "authorization": "QmVhcmVyIGV5SmhiR2NpT2lKSVV6VXhNaUo5LmV5SjFjMlZ5U1dRaU9qSTBOems1TENKMGIydGxiaUk2SWpBME1HRm1aakpoTFdGaU9EY3ROR0poWkMwNFpqZzRMV1V5Wmpoa05EVTFaVE5oTWlKOS5yb0wtNFc2Sm8wbERwNUlRNWVKSVBwMjV5VUp4V2VoRnJiY1JNX04tV0g0OFNSUnN2eEM4RmFkTHhJSGhjVmJjS2V4VnY0TW9pMWVsRHg3MEJwUzkxdw=="
  }
}
```

### login 指令

对仅包含用户名、密码，无验证码的登录形式，可使用预置的通用登录逻辑

以热云 http://39.104.98.139/#/ 为例

#### 接口格式

- POST `/exec`

  body

  ```json
  {
    "url": "", //可选，若给定则覆盖loginUrl
    "cmd": {
      "loginUrl": "http://39.104.98.139/#/", //登录页url
      "type": "login", //固定，login指令
      "userName": "xxx", //用户名
      "password": "xxx", //密码
      "userNameInput": "div.infoBox > ul > li:nth-child(1) > input[type=text]", //用户名输入框的css selector
      "passwordInput": "div.infoBox > ul > li:nth-child(2) > input[type=password]", //密码输入框的css selector
      "loginBtn": "div.loginInfo > div.infoBox > div.login_btn", //登录按钮的css selector
      "successUrlPerfix": "http://39.104.98.139/adi/api/user/userMediaList" //登录成功后跳转到的页面链接（前缀）
    }
  }
  ```

  若有多组用户名密码，可将"userName"和"password"替换为"users",格式为

  ```json
  {
    "users": ["userName1\tpassword1", "userName2\tpassword2"]
  }
  ```

  接口返回

  ```json
  {
    "headers": {
      "authorization": "QmVhcmVyIGV5SmhiR2NpT2lKSVV6VXhNaUo5LmV5SjFjMlZ5U1dRaU9qSTBOems1TENKMGIydGxiaUk2SWpBME1HRm1aakpoTFdGaU9EY3ROR0poWkMwNFpqZzRMV1V5Wmpoa05EVTFaVE5oTWlKOS5yb0wtNFc2Sm8wbERwNUlRNWVKSVBwMjV5VUp4V2VoRnJiY1JNX04tV0g0OFNSUnN2eEM4RmFkTHhJSGhjVmJjS2V4VnY0TW9pMWVsRHg3MEJwUzkxdw=="
    },
    "cookies": { "k1": "v1", "k2": "v2" } //示例
  }
  ```
