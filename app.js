const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const { reqLog, errorHandler } = require('./middleware')
const { getHandler } = require('./handler')


const serve = async () => {
    const app = new Koa()
    const router = new Router()

    router.post('/exec', await getHandler())

    app.use(errorHandler).use(reqLog).use(bodyParser()).use(router.routes())
    app.listen(8080)
}

serve()