const utils = require('../utils')

exports.login = (cmd) => {

    function getAuth(headers) {
        return headers["authorization"] || headers["Authorization"]
    }
    const { loginUrl, userNameInput, passwordInput, loginBtn, successUrlPerfix, statusCode = 200, opDelay = 1000 } = cmd

    let { userName, password, users, checkboxs } = cmd
    if (!(userName && password)) {
        const user = users[Math.floor(users.length * Math.random())];
        [userName, password] = user.split("\t")
    }
    if (!checkboxs) {
        checkboxs = []
    }

    return async (url, page, params) => {
        const { addHeader, setCookie } = params
        const cdpSession = await page.target().createCDPSession()
        const reqsDataRaw = await utils.setupLoggingOfAllNetworkData(page, cdpSession)

        // goto login page
        url = loginUrl || url
        await page.goto(url)

        // set username and password
        await page.evaluate(async (userName, password, userNameInput, passwordInput, opDelay) => {
            const sleep = t => new Promise((r) => setTimeout(r, t))
            const elemUN = document.querySelector(userNameInput)
            elemUN.value = userName
            elemUN.dispatchEvent(new Event("input"))
            await sleep(opDelay)

            const elemPS = document.querySelector(passwordInput)
            elemPS.value = password
            elemPS.dispatchEvent(new Event("input"))
            await sleep(opDelay)
        }, userName, password, userNameInput, passwordInput, opDelay)

        // do login
        // don't use waitForRequest, which may finish and exit before cdpSession handler performed
        const waitPromise = page.waitForResponse(resp => {
            const req = resp.request()
            return decodeURI(req.url()).startsWith(successUrlPerfix) && resp.status() === 200
        }, 10000)

        for (const checkbox of checkboxs) {
            await page.click(checkbox)
            await utils.sleep(opDelay)
        }

        await Promise.all([
            page.click(loginBtn),
            page.waitForNavigation()
        ])

        const successResp = await waitPromise
        const headers = successResp.request().headers()

        let authorization = getAuth(headers)
        // check authorization
        if (!authorization) {
            const requestId = successResp.request()._requestId
            const reqRaw = reqsDataRaw[requestId] || {}
            const requestWillBeSent = utils.pathCheck(reqRaw, ["Network.requestWillBeSent", "request", "headers"])
            const authorization1 = requestWillBeSent && getAuth(requestWillBeSent)
            const requestWillBeSentExtraInfo = utils.pathCheck(reqRaw, ["Network.requestWillBeSentExtraInfo", "headers"])
            const authorization2 = requestWillBeSentExtraInfo && getAuth(requestWillBeSentExtraInfo)
            authorization = authorization1 || authorization2
        }
        if (authorization) {
            addHeader("authorization", authorization)
        }

        const msg = await cdpSession.send("Network.getCookies", { urls: [url] })
        setCookie(msg.cookies)
        setCookie(await page.evaluate(async () => { return document.cookie }))
        await cdpSession.detach()
    }
}