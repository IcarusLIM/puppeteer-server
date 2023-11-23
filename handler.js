const puppeteer = require('puppeteer')
const fs = require("fs")
const utils = require('./utils')
const { LRUCache } = require('lru-cache')
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor

const { login } = require('./cmd/login')
const { cookie: getCookie } = require('./cmd/cookie')
const { downloadPage } = require('./cmd/download')

const browserCache = new LRUCache({
    max: 1,
    disposeAfter: async (browser, key) => {
        console.log("try close browser: " + key)
        const closeIfNoActive = async () => {
            const pages = await browser.pages()
            let isActive = false
            for (const page of pages) {
                if (!(page.url() === "about:blank" || page.isClosed())) {
                    isActive = true;
                    break
                }
            }
            if (!isActive) {
                await browser.close()
                console.log("browser closed: " + key)
            }
            return !isActive
        }
        const isClosed = await closeIfNoActive()
        if (!isClosed) {
            for (const page of await browser.pages()) {
                page.on("close", closeIfNoActive)
            }
            // recheck
            await closeIfNoActive()
        }
    }
})

const getRender = (browser) => {
    return async (url, wrapperFunc, userAgent) => {
        // const ctx = await browser.createIncognitoBrowserContext()
        // const page = await ctx.newPage()
        const page = await browser.newPage()
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
            const funcRet = (await wrapperFunc(url, page, { addHeader, setCookie })) || {}
            return Object.assign(res, funcRet)
        } finally {
            await page.close()
            await ctx.close()
        }
    }
}

const newFunction = (script) => {
    const scriptHeader = ""
    const scriptFooter = "\nreturn await injectFunc(__url__, __page__, __params__)"
    return new AsyncFunction("__url__", "__page__", "__params__", scriptHeader + script + scriptFooter)
}

exports.getHandler = async () => {
    return async (ctx) => {
        const { url, script, cmd, proxy = "", userAgent } = ctx.request.body
        let wrapperFunc
        if (cmd) {
            switch (cmd.type) {
                case "download":
                    wrapperFunc = downloadPage(cmd)
                    break
                case "login":
                    wrapperFunc = login(cmd)
                    break
                case "cookie":
                    let extraFunc = null
                    if (script) {
                        extraFunc = newFunction(script)
                    }
                    wrapperFunc = getCookie(extraFunc, cmd)
            }
        } else {
            wrapperFunc = newFunction(script)
        }
        let browser = browserCache.get(proxy)
        if (!browser) {
            browser = await puppeteer.launch(utils.getLaunchParam(proxy))
            browserCache.set(proxy, browser)
        }
        const render = getRender(browser)
        ctx.body = await render(url, wrapperFunc, userAgent)
    }
};
