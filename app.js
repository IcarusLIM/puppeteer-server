const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const { reqLog, errorHandler } = require('./middleware')
const { getHandler } = require('./handler')



const handler = (render) => {
    return async (ctx) => {
        const { url, script, cmd } = ctx.request.body
        console.log((new Date()).toLocaleString(), " => ", url)

        let injectFunc
        if (cmd) {
            switch (cmd.type) {
                case "login":
                    injectFunc = login(cmd)
                    break
            }
        } else {
            injectFunc = new AsyncFunction("url", "page", "params", "const {addHeader, setCookie} = params;" + script)
        }

        ctx.body = await render(url, injectFunc)
    }
}

const serve = async () => {
    const app = new Koa()
    const router = new Router()

    router.post('/exec', await getHandler())

    app.use(errorHandler).use(reqLog).use(bodyParser()).use(router.routes())
    app.listen(8081)
}

serve()