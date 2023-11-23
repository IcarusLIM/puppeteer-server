const { Page } = require('puppeteer');
const utils = require('../utils')

exports.downloadPage = (cmd) => {

    const { extraWait = 0, waitReady = false, timeout = 30000 } = cmd

    return async (url, page) => {
        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: timeout });
            if (extraWait > 0) {
                await utils.sleep(extraWait)
            }
            if (waitReady) {
                await page.waitForFunction(() => document.readyState === "complete", { timeout: timeout });
            }
            const html = await page.evaluate(() => document.documentElement.outerHTML);
            return { html }
        } catch (err) {
            return { error: err.message }
        }
    }
}