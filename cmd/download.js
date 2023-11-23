const { Page } = require('puppeteer');
const utils = require('../utils')

exports.downloadPage = (cmd) => {

    const { extraWait = 0, waitReady = false, timeout = 30000 } = cmd

    return async (url, page) => {
        try {
            let meta = null;
            page.on('response', resp => {
                const reqUrl = resp.request().url()
                if (reqUrl === url || reqUrl.startsWith(url)) {
                    meta = {
                        headers: resp.headers(),
                        status: resp.status(),
                        ok: resp.ok()
                    }
                }
            })
            await page.goto(url, { waitUntil: 'networkidle2', timeout: timeout });
            if (extraWait > 0) {
                await utils.sleep(extraWait)
            }
            if (waitReady) {
                await page.waitForFunction(() => document.readyState === "complete", { timeout: timeout });
            }
            const body = await page.evaluate(() => document.documentElement.outerHTML);
            return { body, meta }
        } catch (err) {
            return { error: err.message }
        }
    }
}