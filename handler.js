const puppeteer = require('puppeteer')
const fs = require("fs")
const utils = require('./utils')
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor

const { login } = require('./cmd/login')
const { cookie: getCookie } = require('./cmd/cookie')

const getRender = async () => {
    const browser = await puppeteer.launch(Object.assign(utils.getLaunchParam({}, true)))
    return async (url, injectFunc, userAgent) => {
        const ctx = await browser.createIncognitoBrowserContext()
        const page = await ctx.newPage()
        // hide spider 
        await page.evaluateOnNewDocument(async () => {
            const newProto = navigator.__proto__;
            delete newProto.webdriver;
            navigator.__proto__ = newProto;
        });

        await page.setUserAgent(userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36")

        const res = {}
        function addHeader(key, value) {
            if (!res.headers) {
                res.headers = {}
            }
            res.headers[key] = value
        }

        function setCookie(cookieStr) {
            if (typeof (cookieStr) === "string") {
                res.cookies = Object.fromEntries(cookieStr.split(";").map(i => i.split("=")))
            } else {
                // cookieStr is kv
                res.cookies = cookieStr
            }
        }

        try {
            const funcRet = (await injectFunc(url, page, { addHeader, setCookie })) || {}
            return Object.assign(res, funcRet)
        } finally {
            await page.close()
            await ctx.close()
        }
    }
}

const renderWithProxy = async (url, injectFunc, userAgent, proxy) => {
    const browser = await puppeteer.launch(Object.assign(utils.getLaunchParam({ args: [`--proxy-server=${proxy}`] })))
    const page = await browser.newPage()
    await page.evaluateOnNewDocument(async () => {
        const newProto = navigator.__proto__;
        delete newProto.webdriver;
        navigator.__proto__ = newProto;
    });

    await page.setUserAgent(userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36")

    const res = {}
    function addHeader(key, value) {
        if (!res.headers) {
            res.headers = {}
        }
        res.headers[key] = value
    }

    function setCookie(cookieStr) {
        if (typeof (cookieStr) === "string") {
            res.cookies = Object.fromEntries(cookieStr.split(";").map(i => i.split("=")))
        } else {
            // cookieStr is kv
            res.cookies = cookieStr
        }
    }

    try {
        const funcRet = (await injectFunc(url, page, { addHeader, setCookie })) || {}
        return Object.assign(res, funcRet)
    } finally {
        await page.close()
        await browser.close()
    }
}


exports.getHandler = async () => {
    const render = await getRender()

    return async (ctx) => {
        const { url, script, cmd, proxy, userAgent } = ctx.request.body
        let injectFunc
        if (cmd) {
            switch (cmd.type) {
                case "login":
                    injectFunc = login(cmd)
                    break
                case "cookie":
                    let extraFunc = null
                    if (script) {
                        extraFunc = new AsyncFunction("url", "page", script)
                    }
                    injectFunc = getCookie(extraFunc, cmd)
            }
        } else {
            injectFunc = new AsyncFunction("url", "page", "params", "const {addHeader, setCookie} = params;" + script)
        }

        ctx.body = proxy ? (await renderWithProxy(url, injectFunc, userAgent, proxy)) : (await render(url, injectFunc, userAgent))
    }
};
