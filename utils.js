exports.sleep = timeout => {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

exports.getLaunchParam = (originParam, enableCache = false, cacheDirPostfix = "") => {
    if (!originParam.args) {
        originParam.args = []
    }
    if (process.env.PROXY_SERVER) {
        originParam.args.push("--proxy-server=" + process.env.PROXY_SERVER)
    }
    if (process.env.ENV === "docker") {
        originParam.args = originParam.args.concat(['--no-sandbox', '--disable-gpu'])
        originParam = Object.assign({ headless: true }, originParam)
        if (enableCache) {
            originParam = Object.assign({ userDataDir: '/tmp/puppeteer-cache' + cacheDirPostfix }, originParam)
        }
    } else {
        originParam = Object.assign({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: false }, originParam)
        if (enableCache) {
            originParam = Object.assign({ userDataDir: 'D:\\code\\puppeteer-demo\\puppeteer-cache' + cacheDirPostfix }, originParam)
        }
    }
    return originParam
}

// refer issue: https://github.com/puppeteer/puppeteer/issues/5364
exports.setupLoggingOfAllNetworkData = async (page, cdpSession = null) => {
    cdpSession = cdpSession || (await page.target().createCDPSession())
    await cdpSession.send('Network.enable')
    const cdpRequestDataRaw = {}
    const addCDPRequestDataListener = (eventName) => {
        cdpSession.on(eventName, request => {
            cdpRequestDataRaw[request.requestId] = cdpRequestDataRaw[request.requestId] || {}
            Object.assign(cdpRequestDataRaw[request.requestId], { [eventName]: request })
        })
    }
    addCDPRequestDataListener('Network.requestWillBeSent')
    addCDPRequestDataListener('Network.requestWillBeSentExtraInfo')
    addCDPRequestDataListener('Network.responseReceived')
    addCDPRequestDataListener('Network.responseReceivedExtraInfo')
    return cdpRequestDataRaw
}

exports.pathCheck = (o, pathes) => {
    let tmp = o
    for (const path of pathes) {
        if (tmp) {
            tmp = tmp[path]
        }
    }
    return tmp
}
