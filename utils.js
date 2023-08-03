const os = require('os')

exports.sleep = timeout => {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

exports.getLaunchParam = (dynamicProxy = null) => {
    const params = { args: [] }

    if (dynamicProxy) {
        params.args.push("--proxy-server=" + dynamicProxy)
    } else if (process.env.PROXY_SERVER) {
        params.args.push("--proxy-server=" + process.env.PROXY_SERVER)
    }

    if (process.env.ENV === "docker") {
        params.args = params.args.concat(['--no-sandbox', '--disable-gpu'])
        params.headless = true
    } else {
        params.headless = false
    }

    let defaultExepath = '/usr/bin/chromium-browser'
    switch (os.platform()) {
        case 'darwin':
            defaultExepath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            break
        case 'win32':
            defaultExepath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            break
    }
    params.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || defaultExepath

    if (process.env.PUPPETEER_CACHE_PATH) {
        params.userDataDir = process.env.PUPPETEER_CACHE_PATH
    }
    return params
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
