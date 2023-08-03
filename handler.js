const puppeteer = require('puppeteer')
const fs = require("fs")
const utils = require('./utils')
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor

const { login } = require('./cmd/login')
const { cookie: getCookie } = require('./cmd/cookie')

const getRender = async () => {
    const browser = await puppeteer.launch(Object.assign(utils.getLaunchParam()))
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

        function setCookie(cookie) {
            if (typeof (cookie) === "string") {
                res.cookie = cookie
            } else {
                res.cookie_kv = cookie
                res.cookie = cookie.map(i => i.name + "=" + i.value).join(";")
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
    const browser = await puppeteer.launch(utils.getLaunchParam(proxy))
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

    function setCookie(cookie) {
        if (typeof (cookie) === "string") {
            res.cookie = cookie
        } else {
            res.cookie_kv = cookie
            res.cookie = cookie.map(i => i.name + "=" + i.value).join(";")
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

const newFunction = (script) => {
    const scriptHeader = ""
    const scriptFooter = "\nreturn await injectFunc(__url__, __page__, __params__)"
    return new AsyncFunction("__url__", "__page__", "__params__", scriptHeader + script + scriptFooter)
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
                        extraFunc = newFunction(script)
                    }
                    injectFunc = getCookie(extraFunc, cmd)
            }
        } else {
            injectFunc = newFunction(script)
        }

        ctx.body = proxy ? (await renderWithProxy(url, injectFunc, userAgent, proxy)) : (await render(url, injectFunc, userAgent))
    }
};
