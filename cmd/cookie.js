const utils = require('../utils')

exports.cookie = (extraFunc, cmd) => {

    const { url: cookieUrl, allCookies } = cmd

    return async (url, page, params) => {
        const { setCookie } = params
        url = url || cookieUrl
        const cdpSession = await page.target().createCDPSession()

        const waitPromise = page.waitForResponse(resp => {
            const urlWithoutQuery = decodeURI(url).split("?")[0]
            return decodeURI(resp.url()).startsWith(urlWithoutQuery) && resp.status() === 200
        }, 10000)
        await page.goto(url)
        await waitPromise

        const res = {}
        if (extraFunc) {
            res.extra = await extraFunc(url, page)
        }

        const cdpResp = await (allCookies ? cdpSession.send("Network.getAllCookies") : cdpSession.send("Network.getCookies", { urls: [url] }))
        setCookie(cdpResp.cookies)
        await cdpSession.detach()

        return res
    }
}