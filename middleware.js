const log4j = require('log4js')

const logger = log4j.getLogger('middlerwares')
logger.level = log4j.levels.INFO

exports.reqLog = async (ctx, next) => {
    await next()
    const req = ctx.request
    logger.info(`${req.method} ${req.url} ${ctx.status}`)
}

exports.errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        logger.warn(e)
        ctx.status = 500
        ctx.body = { error: e.message }
    }
}