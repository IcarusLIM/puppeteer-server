FROM docker-reg.sogou-inc.com/databus/puppeteer-server-buildenv:latest
WORKDIR /app
COPY . .
ENV TZ Asia/Shanghai
EXPOSE 8080

CMD ["node", "app.js"]